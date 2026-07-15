import { expect, test, type Page } from '@playwright/test';
import { hasE2ECredentials, loginForE2E } from './helpers/auth';

const E2E_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;

async function currentPath(page: Page) {
  return new URL(page.url()).pathname;
}

test.describe('Authentication', () => {
  test.skip(
    !hasE2ECredentials(),
    'Defina PLAYWRIGHT_TEST_EMAIL e PLAYWRIGHT_TEST_PASSWORD com credenciais exclusivas de staging.'
  );

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('logs in with email and password and leaves the auth area', async ({ page }) => {
    await loginForE2E(page);

    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator('body')).toContainText(/NexxoHub|Dashboard|Admin|Portal/i);
  });

  test('keeps the authenticated session after reload', async ({ page }) => {
    await loginForE2E(page);
    const homePath = await currentPath(page);

    await page.reload();

    await expect(page).toHaveURL(new RegExp(`${homePath.replace(/\//g, '\\/')}`));
    await expect(page.locator('body')).toContainText(/NexxoHub|Dashboard|Admin|Portal/i);
  });

  test('redirects authenticated users away from /auth/login', async ({ page }) => {
    await loginForE2E(page);

    await page.goto('/auth/login');

    await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), { timeout: 10_000 });
  });

  test('returns the authenticated user from /api/auth/me', async ({ page }) => {
    await loginForE2E(page);

    const response = await page.request.get('/api/auth/me');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data?.id).toBeTruthy();
    expect(body.data?.email).toBe(E2E_EMAIL);
    expect(Array.isArray(body.data?.memberships)).toBe(true);
  });
});
