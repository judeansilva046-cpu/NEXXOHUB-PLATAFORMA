-- RLS write policies for multi-tenant CRUD operations
-- Admins can INSERT/UPDATE/DELETE org-scoped resources
-- Managers can INSERT/UPDATE employees
-- Users can update their own profile

-- Helper: check if current user is admin in their organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND organization_id = org_id
      AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_org_admin_or_manager(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND organization_id = org_id
      AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (id = current_user_org_id() AND is_org_admin(id));

-- Users
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert users in their organization"
  ON users FOR INSERT
  WITH CHECK (organization_id = current_user_org_id());

CREATE POLICY "Admins can update users in their organization"
  ON users FOR UPDATE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

-- Clinics
CREATE POLICY "Admins can insert clinics"
  ON clinics FOR INSERT
  WITH CHECK (organization_id = current_user_org_id() AND is_org_admin(organization_id));

CREATE POLICY "Admins can update clinics"
  ON clinics FOR UPDATE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

CREATE POLICY "Admins can delete clinics"
  ON clinics FOR DELETE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

-- Companies
CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  WITH CHECK (organization_id = current_user_org_id() AND is_org_admin(organization_id));

CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

CREATE POLICY "Admins can delete companies"
  ON companies FOR DELETE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

-- Employees
CREATE POLICY "Admins and managers can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE organization_id = current_user_org_id()
    )
    AND is_org_admin_or_manager(current_user_org_id())
  );

CREATE POLICY "Admins and managers can update employees"
  ON employees FOR UPDATE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE organization_id = current_user_org_id()
    )
    AND is_org_admin_or_manager(current_user_org_id())
  );

CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  USING (
    company_id IN (
      SELECT id FROM companies WHERE organization_id = current_user_org_id()
    )
    AND is_org_admin(current_user_org_id())
  );

-- Assessments
CREATE POLICY "Admins and managers can insert assessments"
  ON assessments FOR INSERT
  WITH CHECK (organization_id = current_user_org_id() AND is_org_admin_or_manager(organization_id));

CREATE POLICY "Admins and managers can update assessments"
  ON assessments FOR UPDATE
  USING (organization_id = current_user_org_id() AND is_org_admin_or_manager(organization_id));

CREATE POLICY "Admins can delete assessments"
  ON assessments FOR DELETE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

-- Assessment responses
CREATE POLICY "Org members can insert assessment responses"
  ON assessment_responses FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessments WHERE organization_id = current_user_org_id()
    )
  );

CREATE POLICY "Org members can update assessment responses"
  ON assessment_responses FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE organization_id = current_user_org_id()
    )
  );

-- Reports
CREATE POLICY "Admins and managers can insert reports"
  ON reports FOR INSERT
  WITH CHECK (organization_id = current_user_org_id() AND is_org_admin_or_manager(organization_id));

CREATE POLICY "Admins and managers can update reports"
  ON reports FOR UPDATE
  USING (organization_id = current_user_org_id() AND is_org_admin_or_manager(organization_id));

CREATE POLICY "Admins can delete reports"
  ON reports FOR DELETE
  USING (organization_id = current_user_org_id() AND is_org_admin(organization_id));

-- Audit logs (insert only via service, read by admins - already has SELECT)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (organization_id = current_user_org_id());
