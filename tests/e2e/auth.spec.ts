import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const E2E_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const E2E_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

if (!E2E_EMAIL || !E2E_PASSWORD) {
  throw new Error(
    'Defina PLAYWRIGHT_TEST_EMAIL e PLAYWRIGHT_TEST_PASSWORD com credenciais exclusivas de staging.'
  );
}

test.describe('🔐 Autenticação - Suite Completa', () => {
  test.beforeEach(async ({ context }) => {
    // Limpar cookies antes de cada teste
    await context.clearCookies();
  });

  test('1️⃣ Login com email e senha funciona sem erros', async ({ page }) => {
    console.log('[TEST_1] Iniciando login...');
    await page.goto(`${BASE_URL}/auth/login`);
    await expect(page).toHaveURL(`${BASE_URL}/auth/login`);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    await emailInput.fill(E2E_EMAIL);
    await passwordInput.fill(E2E_PASSWORD);

    console.log('[TEST_1] Submeting login form...');
    await submitButton.click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('[TEST_1] ✅ Redirecionado para /dashboard');

    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    const userName = page.locator('text=/judean|dashboard/i');
    await expect(userName).toBeVisible({ timeout: 5000 });

    console.log('[TEST_1] ✅ PASSOU - Login bem-sucedido');
  });

  test('2️⃣ Pressionar F5 mantém autenticação no dashboard', async ({ page }) => {
    console.log('[TEST_2] Testando persistência de sessão...');
    await page.goto(`${BASE_URL}/auth/login`);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill(E2E_EMAIL);
    await passwordInput.fill(E2E_PASSWORD);
    await submitButton.click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('[TEST_2] Login realizado');

    console.log('[TEST_2] Fazendo F5...');
    await page.reload();

    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    const userName = page.locator('text=/judean|dashboard/i');
    await expect(userName).toBeVisible({ timeout: 5000 });

    console.log('[TEST_2] ✅ PASSOU - Autenticação mantida após F5');
  });

  test('3️⃣ Usuário autenticado acessa /auth/login é redirecionado para /dashboard', async ({
    page,
  }) => {
    console.log('[TEST_3] Testando redirecionamento de usuário autenticado...');
    await page.goto(`${BASE_URL}/auth/login`);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill(E2E_EMAIL);
    await passwordInput.fill(E2E_PASSWORD);
    await submitButton.click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    console.log('[TEST_3] Login realizado');

    console.log('[TEST_3] Navegando para /auth/login...');
    await page.goto(`${BASE_URL}/auth/login`);

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

    console.log('[TEST_3] ✅ PASSOU - Redirecionamento sem loop');
  });

  test('4️⃣ Usuário não autenticado é redirecionado de /dashboard para /auth/login', async ({
    browser,
  }) => {
    console.log('[TEST_4] Testando redirecionamento de usuário não autenticado...');

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dashboard`);

    await page.waitForURL(
      (url) => url.pathname === '/auth/login' && url.searchParams.get('portal') === 'nexxohub',
      { timeout: 5000 }
    );
    await expect(page).toHaveURL(/\/auth\/login\?portal=nexxohub$/);

    console.log('[TEST_4] ✅ PASSOU - Redirecionamento correto');
    await context.close();
  });

  test('5️⃣ API /api/auth/me retorna dados do usuário corretamente', async ({ page }) => {
    console.log('[TEST_5] Testando endpoint /api/auth/me...');
    await page.goto(`${BASE_URL}/auth/login`);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill(E2E_EMAIL);
    await passwordInput.fill(E2E_PASSWORD);
    await submitButton.click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    const response = await page.request.get(`${BASE_URL}/api/auth/me`);
    console.log('[TEST_5] Response status:', response.status());
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('[TEST_5] Response body:', data);

    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.id).toBeDefined();
    expect(data.data.email).toBe(E2E_EMAIL);

    console.log('[TEST_5] ✅ PASSOU - API retorna dados corretos');
  });

  test('6️⃣ Dashboard carrega dados do usuário corretamente', async ({ page }) => {
    console.log('[TEST_6] Verificando dados do dashboard...');
    await page.goto(`${BASE_URL}/auth/login`);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill(E2E_EMAIL);
    await passwordInput.fill(E2E_PASSWORD);
    await submitButton.click();

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

    const dashboardTitle = page.locator('text=Dashboard');
    const welcomeText = page.locator('text=NexxoHub');

    await expect(dashboardTitle).toBeVisible();
    await expect(welcomeText).toBeVisible();

    console.log('[TEST_6] ✅ PASSOU - Dashboard carregou corretamente');
  });
});
