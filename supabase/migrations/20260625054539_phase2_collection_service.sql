create table sensitive.collection_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references sensitive.participant_registry(id) on delete set null,
  event_type text not null check (
    event_type in (
      'invited', 'started', 'answers_saved', 'submitted',
      'token_rejected', 'rate_limited'
    )
  ),
  correlation_id uuid not null,
  request_fingerprint text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table sensitive.collection_rate_limits (
  key_hash bytea primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table sensitive.collection_events enable row level security;
alter table sensitive.collection_rate_limits enable row level security;
revoke all on table sensitive.collection_events from public, anon, authenticated;
revoke all on table sensitive.collection_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table
  sensitive.collection_events,
  sensitive.collection_rate_limits
to service_role;

create policy "Portal users cannot access collection events"
on sensitive.collection_events for all to authenticated
using (false) with check (false);
create policy "Portal users cannot access collection rate limits"
on sensitive.collection_rate_limits for all to authenticated
using (false) with check (false);

create index collection_events_participant_occurred_idx
  on sensitive.collection_events(participant_id, occurred_at desc);
create index collection_events_correlation_idx
  on sensitive.collection_events(correlation_id);
create index collection_rate_limits_updated_idx
  on sensitive.collection_rate_limits(updated_at);

create or replace function public.collection_check_rate_limit(
  p_key_hash bytea,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_record sensitive.collection_rate_limits%rowtype;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  select * into current_record
  from sensitive.collection_rate_limits
  where key_hash = p_key_hash
  for update;

  if not found then
    insert into sensitive.collection_rate_limits (
      key_hash, window_started_at, request_count
    ) values (p_key_hash, now(), 1);
    return true;
  end if;

  if current_record.window_started_at
    <= now() - make_interval(secs => p_window_seconds) then
    update sensitive.collection_rate_limits
    set window_started_at = now(), request_count = 1, updated_at = now()
    where key_hash = p_key_hash;
    return true;
  end if;

  if current_record.request_count >= p_limit then
    return false;
  end if;

  update sensitive.collection_rate_limits
  set request_count = request_count + 1, updated_at = now()
  where key_hash = p_key_hash;
  return true;
end;
$$;

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
  select * into invite_row
  from sensitive.participant_tokens
  where token_hash = p_invite_hash
    and purpose = 'invite'
  for update;

  if not found
    or invite_row.consumed_at is not null
    or invite_row.revoked_at is not null
    or invite_row.expires_at <= now() then
    raise exception 'Invalid or expired invitation token';
  end if;

  select * into participant_row
  from sensitive.participant_registry
  where id = invite_row.participant_id
  for update;

  select * into campaign_row
  from public.diagnosis_campaigns
  where id = participant_row.campaign_id;

  if campaign_row.status <> 'open'
    or (campaign_row.opens_at is not null and campaign_row.opens_at > now())
    or (campaign_row.closes_at is not null and campaign_row.closes_at <= now()) then
    raise exception 'Campaign is not open';
  end if;

  select * into existing_session
  from sensitive.response_sessions
  where participant_id = participant_row.id;

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

  update sensitive.participant_tokens
  set consumed_at = now()
  where id = invite_row.id;

  update sensitive.participant_tokens
  set revoked_at = now()
  where participant_id = participant_row.id
    and purpose = 'resume'
    and revoked_at is null
    and consumed_at is null;

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

  update sensitive.participant_registry
  set status = 'started', updated_at = now()
  where id = participant_row.id;

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

    insert into sensitive.answers (
      session_id, question_id, answer_value
    ) values (
      session_row.id,
      (answer_row ->> 'questionId')::uuid,
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
  where answer_row.session_id = session_row.id;

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
    token_row.participant_id,
    'submitted',
    p_correlation_id,
    p_request_fingerprint
  );

  return query select session_row.id, submission_time, calculated_hash;
end;
$$;

revoke all on function public.collection_check_rate_limit(bytea, integer, integer)
  from public, anon, authenticated;
revoke all on function public.collection_start_session(
  bytea, bytea, timestamptz, text, text, uuid, text
) from public, anon, authenticated;
revoke all on function public.collection_save_answers(bytea, jsonb, uuid, text)
  from public, anon, authenticated;
revoke all on function public.collection_submit(bytea, uuid, text)
  from public, anon, authenticated;

grant execute on function public.collection_check_rate_limit(
  bytea, integer, integer
) to service_role;
grant execute on function public.collection_start_session(
  bytea, bytea, timestamptz, text, text, uuid, text
) to service_role;
grant execute on function public.collection_save_answers(
  bytea, jsonb, uuid, text
) to service_role;
grant execute on function public.collection_submit(bytea, uuid, text)
  to service_role;
