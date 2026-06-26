import { expect, test } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

test.describe('Employees CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
    await page.goto('/dashboard/employees');
    await expect(
      page.getByRole('heading', { name: 'Colaboradores', exact: true })
    ).toBeVisible();
  });

  test('should display employees page', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ Novo Colaborador' })).toBeVisible();
  });

  test('should have search by name and email', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nome ou email...');
    await searchInput.fill('employee@example.com');
    await expect(searchInput).toHaveValue('employee@example.com');
  });

  test('should render list or empty state', async ({ page }) => {
    await expect(
      page.getByText('Nenhum colaborador encontrado').or(page.getByRole('table'))
    ).toBeVisible();
  });

  test('should open create employee dialog', async ({ page }) => {
    await page.getByRole('button', { name: '+ Novo Colaborador' }).click();
    await expect(page.getByRole('dialog', { name: 'Novo Colaborador' })).toBeVisible();
  });

  test('should show employee count', async ({ page }) => {
    await expect(page.getByText(/Total: \d+ de \d+ colaborador/)).toBeVisible();
  });
});
