begin;

select plan(6);

select isnt(
  has_schema_privilege('authenticated', 'sensitive', 'usage'),
  true,
  'authenticated cannot access sensitive schema'
);
select isnt(
  has_schema_privilege('anon', 'sensitive', 'usage'),
  true,
  'anon cannot access sensitive schema'
);
select ok(
  has_schema_privilege('service_role', 'sensitive', 'usage'),
  'service_role can access sensitive schema'
);
select isnt(
  has_table_privilege('authenticated', 'sensitive.answers', 'select'),
  true,
  'authenticated cannot read sensitive answers'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.questionnaire_versions'::regclass
      and conname = 'questionnaire_versions_official_item_count'
  ),
  'official 50-item constraint exists'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.question_factor_map'::regclass
      and tgname = 'validate_question_factor_version'
      and not tgisinternal
  ),
  'question-factor version trigger exists'
);

select * from finish();
rollback;
