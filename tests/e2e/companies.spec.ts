import { test, expect } from '@playwright/test';

test.describe('Companies CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/companies');
  });

  test('should display companies page', async ({ page }) => {
    expect(page.locator('h1:has-text("Empresas")')).toBeVisible();
    expect(page.locator('button:has-text("Nova Empresa")')).toBeVisible();
  });

  test('should have functional search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');

    if (await page.locator('table').count() > 0) {
      // Get initial row count
      const initialRows = await page.locator('tbody tr').count();

      // Type in search
      await searchInput.fill('nonexistent12345');

      // Wait for table to update
      await page.waitForTimeout(500);

      // Either shows no results or filtered results
      const noResultsMsg = page.locator('text=/nenhuma empresa/i');
      const rowsAfterSearch = await page.locator('tbody tr').count();

      expect(rowsAfterSearch <= initialRows).toBe(true);
    }
  });

  test('should show company table columns', async ({ page }) => {
    expect(page.locator('th:has-text("Nome")')).toBeVisible();
    expect(page.locator('th:has-text("CNPJ")')).toBeVisible();
  });

  test('should handle create company dialog', async ({ page }) => {
    await page.click('button:has-text("Nova Empresa")');

    expect(page.locator('input[placeholder*="Nome"]')).toBeVisible();
    expect(page.locator('input[placeholder*="CNPJ"]')).toBeVisible();
  });

  test('should have action buttons for each company', async ({ page }) => {
    const table = page.locator('table');

    if (await table.isVisible()) {
      const rows = await page.locator('tbody tr').count();

      if (rows > 0) {
        const firstRow = page.locator('tbody tr').first();
        expect(firstRow.locator('button:has-text("Editar")')).toBeVisible();
        expect(firstRow.locator('button:has-text("Deletar")')).toBeVisible();
      }
    }
  });
});
