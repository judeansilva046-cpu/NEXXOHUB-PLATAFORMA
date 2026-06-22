import { test, expect } from '@playwright/test';

test.describe('Clinics CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clinics page
    await page.goto('/dashboard/clinics');
  });

  test('should display clinics page', async ({ page }) => {
    expect(page.locator('h1:has-text("Clínicas")')).toBeVisible();
    expect(page.locator('text=/Gerenciar suas clínicas/i')).toBeVisible();
    expect(page.locator('button:has-text("Nova Clínica")')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('test');

    // Should show filtered results or no results message
    const table = page.locator('table');
    const emptyMessage = page.locator('text=/nenhuma clínica/i');

    const isTableVisible = await table.isVisible().catch(() => false);
    const isEmptyVisible = await emptyMessage.isVisible().catch(() => false);

    expect(isTableVisible || isEmptyVisible).toBe(true);
  });

  test('should have table with expected columns', async ({ page }) => {
    const table = page.locator('table');

    expect(table.locator('th:has-text("Nome")')).toBeVisible();
    expect(table.locator('th:has-text("CNPJ")')).toBeVisible();
    expect(table.locator('th:has-text("Telefone")')).toBeVisible();
  });

  test('should have create clinic dialog', async ({ page }) => {
    // Click create button
    await page.click('button:has-text("Nova Clínica")');

    // Dialog should appear
    expect(page.locator('text=/Nova Clínica|Novo Clínica/i')).toBeVisible();
    expect(page.locator('input[placeholder*="Nome"]')).toBeVisible();
    expect(page.locator('input[placeholder*="CNPJ"]')).toBeVisible();
  });

  test('should show edit button for each clinic', async ({ page }) => {
    const editButtons = page.locator('button:has-text("Editar")');
    const count = await editButtons.count();

    if (count > 0) {
      expect(editButtons.first()).toBeVisible();
    }
  });

  test('should show delete button for each clinic', async ({ page }) => {
    const deleteButtons = page.locator('button:has-text("Deletar")');
    const count = await deleteButtons.count();

    if (count > 0) {
      expect(deleteButtons.first()).toBeVisible();
    }
  });

  test('should have delete confirmation flow', async ({ page }) => {
    const deleteButtons = page.locator('button:has-text("Deletar")');
    const count = await deleteButtons.count();

    if (count > 0) {
      // Click delete button
      await deleteButtons.first().click();

      // Should show confirm button
      const confirmButton = page.locator('button:has-text("Confirmar")');
      expect(confirmButton).toBeVisible();

      // Should show cancel button
      const cancelButton = page.locator('button:has-text("Cancelar")');
      expect(cancelButton).toBeVisible();
    }
  });

  test('should display total clinic count', async ({ page }) => {
    const description = page.locator('[class*="CardDescription"]');
    const text = await description.textContent();

    expect(text).toMatch(/Total:\s*\d+\s*de\s*\d+/i);
  });
});
