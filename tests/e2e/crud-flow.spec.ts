import { expect, test } from '@playwright/test';
import { loginForE2E } from './helpers/auth';

test.describe('Complete CRUD Flow - Clinics', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
    await page.goto('/dashboard/clinics');
    await expect(page.getByRole('heading', { name: 'Clínicas', exact: true })).toBeVisible();
  });

  test('should complete create → read → update → delete flow', async ({ page }) => {
    test.setTimeout(60_000);
    const suffix = Date.now().toString().slice(-8);
    const originalName = `Clínica E2E ${suffix}`;
    const updatedName = `${originalName} Atualizada`;

    await page.getByRole('button', { name: '+ Nova Clínica' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nova Clínica' });
    await dialog.getByRole('textbox', { name: 'Nome' }).fill(originalName);
    await dialog
      .getByRole('textbox', { name: 'CNPJ' })
      .fill(`98.${suffix.slice(0, 3)}.${suffix.slice(3, 6)}/0001-${suffix.slice(6, 8)}`);
    await dialog.getByRole('textbox', { name: 'Responsável' }).fill('Responsável E2E');
    await dialog.getByRole('textbox', { name: 'E-mail' }).fill(`e2e-${suffix}@example.test`);
    await dialog.getByRole('textbox', { name: 'Telefone' }).fill('(11) 99999-9999');
    await dialog.getByRole('textbox', { name: 'Endereço' }).fill('Rua E2E, 123');
    await dialog.getByRole('textbox', { name: 'Especialidades' }).fill('Psicologia');
    await dialog.getByRole('button', { name: 'Salvar clínica' }).click();

    await expect(page.getByText(originalName)).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: originalName });
    await row.getByRole('button', { name: 'Editar' }).click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();
    await expect(
      editDialog.getByRole('heading', { name: 'Editar Clínica', exact: true })
    ).toBeVisible();
    await editDialog.getByRole('textbox', { name: 'Nome' }).fill(updatedName);
    await editDialog.getByRole('button', { name: 'Salvar clínica' }).click();
    await expect(page.getByText(updatedName)).toBeVisible();

    const updatedRow = page.getByRole('row').filter({ hasText: updatedName });
    await updatedRow.getByRole('button', { name: 'Deletar' }).click();
    await updatedRow.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(updatedName)).toHaveCount(0);
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: '+ Nova Clínica' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nova Clínica' });
    await dialog.getByRole('button', { name: 'Salvar clínica' }).click();
    await expect(dialog.getByText('CNPJ inválido')).toBeVisible();
    await expect(dialog.getByText('Email inválido')).toBeVisible();
  });

  test('should filter clinics by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por nome ou CNPJ...');
    await searchInput.fill('xyznonexistent12345');
    await expect(page.getByText('Nenhuma clínica encontrada')).toBeVisible();
  });
});
