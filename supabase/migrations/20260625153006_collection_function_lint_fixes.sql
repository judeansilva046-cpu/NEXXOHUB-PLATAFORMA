create or replace function public.collection_start_session(
  p_invite_hash bytea,
  p_resume_hash bytea,
  p_resume_expires_at timestamptz,
  p_consent_version text,
  p_consent_evidence_hash text,
  p_correlation_id uuid,
  p_request_fingerprint text default null
)
returns table (
  session_id uuid,
  participant_id uuid,
  campaign_id uuid,
  questionnaire_version_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row sensitive.participant_tokens%rowtype;
  participant_row sensitive.participant_registry%rowtype;
  campaign_row public.diagnosis_campaigns%rowtype;
  existing_session sensitive.response_sessions%rowtype;
begin
  select token.*
  into invite_row
  from sensitive.participant_tokens token
  where token.token_hash = p_invite_hash
    and token.purpose = 'invite'
  for update;

  if not found
    or invite_row.consumed_at is not null
    or invite_row.revoked_at is not null
    or invite_row.expires_at <= now() then
    raise exception 'Invalid or expired invitation token';
  end if;

  select participant.*
  into participant_row
  from sensitive.participant_registry participant
  where participant.id = invite_row.participant_id
  for update;

  select campaign.*
  into campaign_row
  from public.diagnosis_campaigns campaign
  where campaign.id = participant_row.campaign_id;

  if campaign_row.status <> 'open'
    or (campaign_row.opens_at is not null and campaign_row.opens_at > now())
    or (campaign_row.closes_at is not null and campaign_row.closes_at <= now()) then
    raise exception 'Campaign is not open';
  end if;

  select response_session.*
  into existing_session
  from sensitive.response_sessions response_session
  where response_session.participant_id = participant_row.id;

  if found and existing_session.status <> 'in_progress' then
    raise exception 'Response session is not available';
  end if;

  if not found then
    insert into sensitive.response_sessions (
      participant_id,
      questionnaire_version_id,
      consent_version,
      consented_at
    ) values (
      participant_row.id,
      campaign_row.questionnaire_version_id,
      p_consent_version,
      now()
    )
    returning * into existing_session;

    insert into sensitive.consent_events (
      participant_id,
      consent_version,
      event_type,
      evidence_hash
    ) values (
      participant_row.id,
      p_consent_version,
      'granted',
      p_consent_evidence_hash
    );
  end if;

  update sensitive.participant_tokens token
  set consumed_at = now()
  where token.id = invite_row.id;

  update sensitive.participant_tokens token
  set revoked_at = now()
  where token.participant_id = participant_row.id
    and token.purpose = 'resume'
    and token.revoked_at is null
    and token.consumed_at is null;

  insert into sensitive.participant_tokens (
    participant_id,
    token_hash,
    purpose,
    expires_at
  ) values (
    participant_row.id,
    p_resume_hash,
    'resume',
    p_resume_expires_at
  );

  update sensitive.participant_registry participant
  set status = 'started', updated_at = now()
  where participant.id = participant_row.id;

  insert into sensitive.collection_events (
    participant_id, event_type, correlation_id, request_fingerprint
  ) values (
    participant_row.id, 'started', p_correlation_id, p_request_fingerprint
  );

  return query select
    existing_session.id,
    participant_row.id,
    participant_row.campaign_id,
    existing_session.questionnaire_version_id;
end;
$$;

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

  select token.*
  into token_row
  from sensitive.participant_tokens token
  where token.token_hash = p_resume_hash
    and token.purpose = 'resume'
  for update;

  if not found
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.expires_at <= now() then
    raise exception 'Invalid or expired session token';
  end if;

  select response_session.*
  into session_row
  from sensitive.response_sessions response_session
  where response_session.participant_id = token_row.participant_id
  for update;

  if not found or session_row.status <> 'in_progress' then
    raise exception 'Response session is not editable';
  end if;

  for answer_row in select value from jsonb_array_elements(p_answers)
  loop
    if not (answer_row ? 'questionId' and answer_row ? 'value') then
      raise exception 'Invalid answer item';
    end if;

    select question.*
    into question_row
    from public.psychosocial_questions question
    where question.id = (answer_row ->> 'questionId')::uuid
      and question.questionnaire_version_id = session_row.questionnaire_version_id
      and question.is_active;

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
    on conflict on constraint answers_session_id_question_id_key
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

revoke all on function public.collection_start_session(
  bytea, bytea, timestamptz, text, text, uuid, text
) from public, anon, authenticated;
revoke all on function public.collection_save_answers(bytea, jsonb, uuid, text)
  from public, anon, authenticated;
grant execute on function public.collection_start_session(
  bytea, bytea, timestamptz, text, text, uuid, text
) to service_role;
grant execute on function public.collection_save_answers(bytea, jsonb, uuid, text)
  to service_role;
