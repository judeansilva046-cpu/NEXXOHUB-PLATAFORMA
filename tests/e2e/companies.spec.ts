import { expect, test } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

test.describe('Companies CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
    await page.goto('/dashboard/companies');
    await expect(page.getByRole('heading', { name: 'Empresas', exact: true })).toBeVisible();
  });

  test('should display companies page', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ Nova Empresa' })).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nome ou CNPJ...');
    await searchInput.fill('nonexistent12345');
    await expect(searchInput).toHaveValue('nonexistent12345');
    await expect(page.getByText('Nenhuma empresa encontrada')).toBeVisible();
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
