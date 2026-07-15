import { expect, test } from '@playwright/test';
import { hasE2ECredentials, loginForE2E, skipUnlessPortalMembership } from './helpers/auth';

test.describe('Companies CRUD Flow', () => {
  test.skip(
    !hasE2ECredentials(),
    'Defina PLAYWRIGHT_TEST_EMAIL e PLAYWRIGHT_TEST_PASSWORD com credenciais exclusivas de staging.'
  );

  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
    await skipUnlessPortalMembership(page, 'clinic');
    await page.goto('/clinic/companies');
    await expect(page.getByRole('heading', { name: 'Empresas clientes' })).toBeVisible();
  });

  test('should display companies page', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ Nova Empresa' })).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nome, razão social ou CNPJ...');
    await searchInput.fill('nonexistent12345');
    await expect(searchInput).toHaveValue('nonexistent12345');
    await expect(page.getByText('Nenhuma empresa encontrada para esta clínica.')).toBeVisible();
  });

  test('should render list or empty state', async ({ page }) => {
    await expect(
      page.getByText('Nenhuma empresa encontrada').or(page.getByRole('table'))
    ).toBeVisible();
  });

  test('should open create company dialog', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nova Empresa' }).click();
    await expect(page.getByRole('dialog', { name: 'Nova Empresa' })).toBeVisible();
  });
});
