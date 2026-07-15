import { expect, test } from '@playwright/test';

test.describe('Public smoke checks', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();
  });

  test('login page renders core controls', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /Acessar Plataforma/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('register page renders core controls', async ({ page }) => {
    await page.goto('/auth/register');

    await expect(page.getByText('Criar Conta').first()).toBeVisible();
    await expect(page.getByLabel('Nome Completo')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Nome da Organização')).toBeVisible();
    await expect(page.getByLabel('CNPJ da Organização')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Senha*', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Confirmar Senha*' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Conta' })).toBeVisible();
  });

  test('forgot password page renders core controls', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.getByRole('heading', { name: 'Recuperar Senha' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar link de recuperação' })).toBeVisible();
  });

  test('reset password page renders core controls', async ({ page }) => {
    await page.goto('/auth/reset-password');

    await expect(page.getByRole('heading', { name: 'Definir nova senha' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nova senha*', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Confirmar nova senha*' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atualizar senha' })).toBeVisible();
  });

  test('anonymous admin access redirects to NexxoHub login', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'nexxohub',
      { timeout: 10_000 }
    );
  });

  test('anonymous dashboard access redirects to NexxoHub login', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'nexxohub',
      { timeout: 10_000 }
    );
  });

  test('anonymous NexxoHub access redirects to NexxoHub login', async ({ page }) => {
    await page.goto('/nexxohub');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'nexxohub',
      { timeout: 10_000 }
    );
  });

  test('anonymous finance access redirects to NexxoHub login', async ({ page }) => {
    await page.goto('/finance');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'nexxohub',
      { timeout: 10_000 }
    );
  });

  test('anonymous clinic access redirects to clinic login', async ({ page }) => {
    await page.goto('/clinic');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'clinic',
      { timeout: 10_000 }
    );
  });

  test('anonymous company access redirects to company login', async ({ page }) => {
    await page.goto('/company');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'company',
      { timeout: 10_000 }
    );
  });

  test('anonymous employee access redirects to employee login', async ({ page }) => {
    await page.goto('/employee');

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'employee',
      { timeout: 10_000 }
    );
  });
});
