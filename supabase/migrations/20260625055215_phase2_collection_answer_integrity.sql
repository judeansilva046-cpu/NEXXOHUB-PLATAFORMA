create or replace function public.collection_save_answers(
  p_resume_hash bytea,
  p_answers jsonb,
  p_correlation_id uuid,
  p_request_fingerprint text default null
)
returns table (
  session_id uuid,
  saved_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_row sensitive.participant_tokens%rowtype;
  session_row sensitive.response_sessions%rowtype;
  answer_row jsonb;
  question_row public.psychosocial_questions%rowtype;
  affected integer := 0;
begin
  if jsonb_typeof(p_answers) <> 'array'
    or jsonb_array_length(p_answers) < 1
    or jsonb_array_length(p_answers) > 50 then
    raise exception 'Invalid answer payload';
  end if;

  select * into token_row
  from sensitive.participant_tokens
  where token_hash = p_resume_hash
    and purpose = 'resume'
  for update;

  if not found
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.expires_at <= now() then
    raise exception 'Invalid or expired session token';
  end if;

  select * into session_row
  from sensitive.response_sessions
  where participant_id = token_row.participant_id
  for update;

  if not found or session_row.status <> 'in_progress' then
    raise exception 'Response session is not editable';
  end if;

  for answer_row in select value from jsonb_array_elements(p_answers)
  loop
    if not (answer_row ? 'questionId' and answer_row ? 'value') then
      raise exception 'Invalid answer item';
    end if;

    select * into question_row
    from public.psychosocial_questions
    where id = (answer_row ->> 'questionId')::uuid
      and questionnaire_version_id = session_row.questionnaire_version_id
      and is_active;

    if not found then
      raise exception 'Question does not belong to this questionnaire version';
    end if;

    insert into sensitive.answers (
      session_id, question_id, answer_value
    ) values (
      session_row.id,
      question_row.id,
      (answer_row ->> 'value')::smallint
    )
    on conflict (session_id, question_id)
    do update set
      answer_value = excluded.answer_value,
      updated_at = now();

    affected := affected + 1;
  end loop;

  insert into sensitive.collection_events (
    participant_id,
    event_type,
    correlation_id,
    request_fingerprint,
    metadata
  ) values (
    token_row.participant_id,
    'answers_saved',
    p_correlation_id,
    p_request_fingerprint,
    jsonb_build_object('count', affected)
  );

  return query select session_row.id, affected;
end;
$$;

create or replace function public.collection_submit(
  p_resume_hash bytea,
  p_correlation_id uuid,
  p_request_fingerprint text default null
)
returns table (
  session_id uuid,
  submitted_at timestamptz,
  input_hash text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_row sensitive.participant_tokens%rowtype;
  session_row sensitive.response_sessions%rowtype;
  required_count integer;
  answered_count integer;
  calculated_hash text;
  submission_time timestamptz := now();
begin
  select * into token_row
  from sensitive.participant_tokens
  where token_hash = p_resume_hash
    and purpose = 'resume'
  for update;

  if not found
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.expires_at <= now() then
    raise exception 'Invalid or expired session token';
  end if;

  select * into session_row
  from sensitive.response_sessions
  where participant_id = token_row.participant_id
  for update;

  if not found or session_row.status <> 'in_progress' then
    raise exception 'Response session cannot be submitted';
  end if;

  select count(*) into required_count
  from public.psychosocial_questions
  where questionnaire_version_id = session_row.questionnaire_version_id
    and is_active
    and is_required;

  select count(*) into answered_count
  from sensitive.answers answer_row
  join public.psychosocial_questions question_row
    on question_row.id = answer_row.question_id
  where answer_row.session_id = session_row.id
    and question_row.questionnaire_version_id = session_row.questionnaire_version_id
    and question_row.is_active
    and question_row.is_required;

  if answered_count <> required_count or required_count <> 50 then
    raise exception 'All required questions must be answered';
  end if;

  select encode(
    extensions.digest(
      string_agg(
        question_row.code || ':' || answer_row.answer_value::text,
        '|' order by question_row.display_order
      ),
      'sha256'
    ),
    'hex'
  )
  into calculated_hash
  from sensitive.answers answer_row
  join public.psychosocial_questions question_row
    on question_row.id = answer_row.question_id
  where answer_row.session_id = session_row.id
    and question_row.questionnaire_version_id = session_row.questionnaire_version_id
    and question_row.is_active;

  update sensitive.response_sessions
  set
    status = 'submitted',
    submitted_at = submission_time,
    input_hash = calculated_hash,
    updated_at = submission_time
  where id = session_row.id;

  update sensitive.participant_registry
  set
    status = 'completed',
    completed_at = submission_time,
    updated_at = submission_time
  where id = token_row.participant_id;

  update sensitive.participant_tokens
  set consumed_at = submission_time
  where id = token_row.id;

  insert into sensitive.collection_events (
    participant_id, event_type, correlation_id, request_fingerprint
  ) values (
    token_row.participant_id, 'submitted', p_correlation_id, p_request_fingerprint
  );

  return query select session_row.id, submission_time, calculated_hash;
end;
$$;

revoke all on function public.collection_save_answers(bytea, jsonb, uuid, text)
  from public, anon, authenticated;
revoke all on function public.collection_submit(bytea, uuid, text)
  from public, anon, authenticated;
grant execute on function public.collection_save_answers(bytea, jsonb, uuid, text)
  to service_role;
grant execute on function public.collection_submit(bytea, uuid, text)
  to service_role;
