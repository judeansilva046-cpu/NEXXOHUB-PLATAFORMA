import { expect, test } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

test.describe('Clinics CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
    await page.goto('/dashboard/clinics');
    await expect(page.getByRole('heading', { name: 'Clínicas', exact: true })).toBeVisible();
  });

  test('should display clinics page', async ({ page }) => {
    await expect(page.getByText('Gerenciar suas clínicas')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Nova Clínica' })).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nome ou CNPJ...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('should render list or empty state', async ({ page }) => {
    const emptyState = page.getByText('Nenhuma clínica encontrada');
    const table = page.getByRole('table');
    await expect(emptyState.or(table)).toBeVisible();
  });

  test('should have create clinic dialog', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nova Clínica' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nova Clínica' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Nome' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'CNPJ' })).toBeVisible();
  });

  test('should display total clinic count', async ({ page }) => {
    await expect(page.getByText(/Total: \d+ de \d+ clínica/)).toBeVisible();
  });
});
