import { test, type Page } from '@playwright/test';

export function hasE2ECredentials() {
  return Boolean(process.env.PLAYWRIGHT_TEST_EMAIL && process.env.PLAYWRIGHT_TEST_PASSWORD);
}

export async function loginForE2E(page: Page) {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('Defina PLAYWRIGHT_TEST_EMAIL e PLAYWRIGHT_TEST_PASSWORD para os testes E2E.');
  }

  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  const [signinResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/signin') && response.request().method() === 'POST',
      { timeout: 30_000 }
    ),
    page.locator('button[type="submit"]').click(),
  ]);

  if (!signinResponse.ok()) {
    const body = await signinResponse.text();
    throw new Error(`Login E2E falhou (${signinResponse.status()}): ${body}`);
  }

  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), {
    timeout: 30_000,
    waitUntil: 'commit',
  });
}

export async function skipUnlessPortalMembership(page: Page, portal: string) {
  const response = await page.request.get('/api/auth/me');
  if (!response.ok()) {
    test.skip(true, `Conta E2E não conseguiu consultar /api/auth/me (${response.status()}).`);
    return;
  }

  const body = await response.json();
  const memberships = Array.isArray(body.data?.memberships) ? body.data.memberships : [];
  const hasMembership = memberships.some(
    (membership: { portal?: string; is_active?: boolean }) =>
      membership.portal === portal && membership.is_active !== false
  );

  test.skip(!hasMembership, `Conta E2E sem membership ativa para o portal ${portal}.`);
}
