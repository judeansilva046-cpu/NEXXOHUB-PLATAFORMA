revoke all on table
  public.organizations,
  public.users,
  public.clinics,
  public.companies,
  public.employees,
  public.assessments,
  public.assessment_responses,
  public.reports,
  public.audit_logs
from anon;

grant select, insert, update, delete on table
  public.organizations,
  public.users,
  public.clinics,
  public.companies,
  public.employees,
  public.assessments,
  public.reports
to authenticated;

grant select on table public.audit_logs to authenticated;

-- Raw assessment answers are available only through the dedicated secure flow.
revoke all on table public.assessment_responses from anon, authenticated;
