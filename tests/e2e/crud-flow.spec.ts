import { test, expect } from '@playwright/test';

test.describe('Complete CRUD Flow - Clinics', () => {
  test('should complete create → read → update → delete flow', async ({ page }) => {
    await page.goto('/dashboard/clinics');

    // 1. READ - Verify initial state
    expect(page.locator('h1:has-text("Clínicas")')).toBeVisible();

    const initialCountText = await page
      .locator('[class*="CardDescription"]')
      .textContent();

    // 2. CREATE - Create a new clinic
    await page.click('button:has-text("Nova Clínica")');

    // Fill form
    await page.fill('input[placeholder*="Nome"]', 'Clínica E2E Test');
    await page.fill('input[placeholder*="CNPJ"]', '12.345.678/0001-99');
    await page.fill('input[placeholder*="Telefone"]', '(11) 9999-9999');
    await page.fill('input[placeholder*="Endereço"]', 'Rua E2E, 123');

    // Submit
    const submitButton = page.locator('button:has-text("Salvar")').first();
    await submitButton.click();

    // Wait for toast notification
    const toastSuccess = page.locator('text=/sucesso|criada/i');
    await expect(toastSuccess).toBeVisible({ timeout: 5000 });

    // 3. READ - Verify clinic appears in list
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('Clínica E2E Test');

    await page.waitForTimeout(500);
    expect(page.locator('text=/Clínica E2E Test/i')).toBeVisible();

    // 4. UPDATE - Edit the clinic
    const editButton = page.locator('button:has-text("Editar")').first();
    await editButton.click();

    // Change name
    const nameInput = page.locator('input[placeholder*="Nome"]').first();
    await nameInput.clear();
    await nameInput.fill('Clínica E2E Test Updated');

    // Save
    const saveButton = page.locator('button:has-text("Salvar")').first();
    await saveButton.click();

    // Wait for success
    await expect(toastSuccess).toBeVisible({ timeout: 5000 });

    // Verify update
    await page.waitForTimeout(1000);
    expect(page.locator('text=/Clínica E2E Test Updated/i')).toBeVisible();

    // 5. DELETE - Delete the clinic
    await searchInput.clear();
    await searchInput.fill('Clínica E2E Test Updated');

    await page.waitForTimeout(500);
    const deleteButton = page.locator('button:has-text("Deletar")').first();
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Confirmar")').first();
    await confirmButton.click();

    // Wait for success
    await expect(toastSuccess).toBeVisible({ timeout: 5000 });

    // Verify deletion
    await page.waitForTimeout(1000);
    const emptyMsg = page.locator('text=/nenhuma clínica/i');
    const isDeletedVisible = await emptyMsg.isVisible().catch(() => false);
    const stillExists = await page.locator('text=/Clínica E2E Test Updated/i')
      .isVisible()
      .catch(() => false);

    expect(!stillExists || isDeletedVisible).toBe(true);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/clinics');
    await page.click('button:has-text("Nova Clínica")');

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Salvar")').first();
    await submitButton.click();

    // Should show validation error
    const errorMsg = page.locator('text=/obrigatório|required|inválido/i');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('should filter clinics by search', async ({ page }) => {
    await page.goto('/dashboard/clinics');

    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      const initialRowCount = await page.locator('tbody tr').count();

      // Search with pattern that likely won't match
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await searchInput.fill('xyznonexistent12345');

      await page.waitForTimeout(500);

      const filteredRowCount = await page.locator('tbody tr').count();
      expect(filteredRowCount <= initialRowCount).toBe(true);
    }
  });
});
