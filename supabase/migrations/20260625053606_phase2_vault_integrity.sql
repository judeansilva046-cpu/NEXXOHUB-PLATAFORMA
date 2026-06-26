alter table public.questionnaire_versions
  add constraint questionnaire_versions_official_item_count
    check (item_count = 50),
  add constraint questionnaire_versions_official_factor_count
    check (factor_count = 13);

create or replace function private.validate_methodology_relationships()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_version uuid;
  factor_version uuid;
begin
  select questionnaire_version_id into question_version
  from public.psychosocial_questions
  where id = new.question_id;

  select questionnaire_version_id into factor_version
  from public.psychosocial_factors
  where id = new.factor_id;

  if question_version is null
    or factor_version is null
    or question_version <> factor_version then
    raise exception 'Question and factor must belong to the same questionnaire version';
  end if;

  return new;
end;
$$;

create or replace function private.validate_sensitive_response_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_company uuid;
  employee_company uuid;
  expected_version uuid;
  actual_version uuid;
  session_status text;
begin
  if tg_table_name = 'participant_registry' then
    select cycle_row.company_id into expected_company
    from public.diagnosis_campaigns campaign
    join public.diagnosis_cycles cycle_row on cycle_row.id = campaign.cycle_id
    where campaign.id = new.campaign_id;

    select company_id into employee_company
    from public.employees
    where id = new.employee_id;

    if expected_company is null
      or employee_company is null
      or expected_company <> employee_company then
      raise exception 'Participant employee is outside the campaign company';
    end if;
  elsif tg_table_name = 'response_sessions' then
    select campaign.questionnaire_version_id into expected_version
    from sensitive.participant_registry participant
    join public.diagnosis_campaigns campaign
      on campaign.id = participant.campaign_id
    where participant.id = new.participant_id;

    if expected_version is null
      or expected_version <> new.questionnaire_version_id then
      raise exception 'Response session version differs from campaign version';
    end if;
  elsif tg_table_name = 'answers' then
    select
      session_row.questionnaire_version_id,
      session_row.status
    into expected_version, session_status
    from sensitive.response_sessions session_row
    where session_row.id = new.session_id;

    select questionnaire_version_id into actual_version
    from public.psychosocial_questions
    where id = new.question_id;

    if expected_version is null
      or actual_version is null
      or expected_version <> actual_version then
      raise exception 'Answer question differs from the response session version';
    end if;

    if session_status <> 'in_progress' then
      raise exception 'Answers can only change while the session is in progress';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.validate_methodology_relationships()
  from public, anon, authenticated;
revoke all on function private.validate_sensitive_response_scope()
  from public, anon, authenticated;

create trigger validate_question_factor_version
  before insert or update on public.question_factor_map
  for each row execute function private.validate_methodology_relationships();

create trigger validate_participant_scope
  before insert or update on sensitive.participant_registry
  for each row execute function private.validate_sensitive_response_scope();
create trigger validate_response_session_scope
  before insert or update on sensitive.response_sessions
  for each row execute function private.validate_sensitive_response_scope();
create trigger validate_answer_scope
  before insert or update on sensitive.answers
  for each row execute function private.validate_sensitive_response_scope();
