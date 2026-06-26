begin;

select plan(8);

select isnt(
  has_function_privilege(
    'anon',
    'public.collection_start_session(bytea,bytea,timestamptz,text,text,uuid,text)',
    'execute'
  ),
  true,
  'anon cannot execute collection_start_session'
);
select isnt(
  has_function_privilege(
    'authenticated',
    'public.collection_save_answers(bytea,jsonb,uuid,text)',
    'execute'
  ),
  true,
  'authenticated cannot execute collection_save_answers'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.collection_submit(bytea,uuid,text)',
    'execute'
  ),
  'service_role can execute collection_submit'
);
select ok(
  not has_schema_privilege('anon', 'sensitive', 'usage')
  and not has_schema_privilege('authenticated', 'sensitive', 'usage'),
  'portal roles cannot access sensitive schema'
);
select ok(
  position(
    'question.questionnaire_version_id=session_row.questionnaire_version_id'
    in regexp_replace(
      pg_get_functiondef(
        'public.collection_save_answers(bytea,jsonb,uuid,text)'::regprocedure
      ),
      '\s+',
      '',
      'g'
    )
  ) > 0,
  'answer-version integrity check exists'
);
select ok(
  public.collection_check_rate_limit(decode(repeat('ab', 32), 'hex'), 2, 60),
  'first rate-limit request is accepted'
);
select ok(
  public.collection_check_rate_limit(decode(repeat('ab', 32), 'hex'), 2, 60),
  'second rate-limit request is accepted'
);
select isnt(
  public.collection_check_rate_limit(decode(repeat('ab', 32), 'hex'), 2, 60),
  true,
  'third rate-limit request is rejected'
);

select * from finish();
rollback;
