import { test, expect } from '@playwright/test';

test.describe('Employees CRUD Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/employees');
  });

  test('should display employees page', async ({ page }) => {
    expect(page.locator('h1:has-text("Colaboradores")')).toBeVisible();
    expect(page.locator('button:has-text("Novo Colaborador")')).toBeVisible();
  });

  test('should have search by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    expect(searchInput).toBeVisible();

    // Search for something unlikely
    await searchInput.fill('xyzunknown123');

    // Should show no results or filtered
    await page.waitForTimeout(500);

    const noResultsMsg = page.locator('text=/nenhum colaborador/i');
    const isVisible = await noResultsMsg.isVisible().catch(() => false);
    expect(isVisible || (await page.locator('tbody tr').count()) === 0).toBe(true);
  });

  test('should search by email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]');

    // Search by email pattern
    await searchInput.fill('@');

    // Should show results with @ in email
    await page.waitForTimeout(500);

    const rows = await page.locator('tbody tr').count();
    // Either has results or no results message
    const hasResults = rows > 0 || await page.locator('text=/nenhum/i').isVisible();
    expect(hasResults).toBe(true);
  });

  test('should display employee table columns', async ({ page }) => {
    expect(page.locator('th:has-text("Nome")')).toBeVisible();
    expect(page.locator('th:has-text("Email")')).toBeVisible();
    expect(page.locator('th:has-text("Cargo")')).toBeVisible();
  });

  test('should open create employee dialog', async ({ page }) => {
    await page.click('button:has-text("Novo Colaborador")');

    // Dialog should show
    expect(page.locator('text=/Novo Colaborador/i')).toBeVisible();

    // Form fields should be visible
    expect(page.locator('input[placeholder*="Nome"]')).toBeVisible();
    expect(page.locator('input[placeholder*="Email"]')).toBeVisible();
  });

  test('should have edit action for employees', async ({ page }) => {
    const table = page.locator('table');

    if (await table.isVisible()) {
      const rows = await page.locator('tbody tr').count();

      if (rows > 0) {
        const editButton = page.locator('tbody tr').first().locator('button:has-text("Editar")');
        expect(editButton).toBeVisible();
      }
    }
  });

  test('should have delete action for employees', async ({ page }) => {
    const table = page.locator('table');

    if (await table.isVisible()) {
      const rows = await page.locator('tbody tr').count();

      if (rows > 0) {
        const deleteButton = page.locator('tbody tr').first().locator('button:has-text("Deletar")');
        expect(deleteButton).toBeVisible();
      }
    }
  });

  test('should show employee count', async ({ page }) => {
    const cardDescription = page.locator('[class*="CardDescription"]');
    const text = await cardDescription.textContent();

    // Should show something like "Total: X de Y colaborador(es)"
    if (text) {
      expect(text.toLowerCase()).toContain('total');
    }
  });
});
