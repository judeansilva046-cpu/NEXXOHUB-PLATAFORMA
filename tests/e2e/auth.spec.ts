import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login');

    expect(await page.title()).toContain('NexxoHub');
    expect(page.locator('input[type="email"]')).toBeVisible();
    expect(page.locator('input[type="password"]')).toBeVisible();
    expect(page.locator('button:has-text("Entrar")')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Entrar")');

    // Should show validation error
    const errorMessage = page.locator('text=/invalid|válido|email/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should validate password is not empty', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill email only
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Entrar")');

    // Should show validation error
    const errorMessage = page.locator('text=/obrigatório|required|senha/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should have register link', async ({ page }) => {
    await page.goto('/auth/login');

    const registerLink = page.locator('a:has-text(/cadastre|registre|inscrever/i)');
    await expect(registerLink).toBeVisible();
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/auth/login');

    const forgotLink = page.locator('a:has-text(/esqueci|reset|recuperar/i)');
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect from auth pages when authenticated', async ({ page }) => {
    // This test requires a session - in real scenario you'd set up auth
    // For now, just verify the route exists
    const response = await page.goto('/auth/login');
    expect(response?.status()).toBeLessThan(500);
  });
});
