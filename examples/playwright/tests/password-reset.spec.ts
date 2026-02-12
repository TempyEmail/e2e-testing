import { test, expect } from '@playwright/test';
import { TempyEmail } from '@tempyemail/e2e-testing';

/**
 * Example: Password reset flow with magic link
 *
 * This test demonstrates:
 * 1. Creating a user account with a temp email
 * 2. Requesting a password reset
 * 3. Extracting the reset link from email
 * 4. Following the link and setting a new password
 */
test('password reset with magic link', async ({ page }) => {
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  console.log(`Using email: ${mailbox.address}`);

  // First, create an account
  await page.goto('https://example.com/signup');
  await page.fill('input[name="email"]', mailbox.address);
  await page.fill('input[name="password"]', 'OldPassword123!');
  await page.click('button[type="submit"]');

  // Verify account
  const signupOtp = await mailbox.waitForOTP({ timeout: 30000 });
  await page.fill('input[name="verificationCode"]', signupOtp);
  await page.click('button[type="submit"]');

  // Logout
  await page.click('button[aria-label="Logout"]');

  // Request password reset
  await page.goto('https://example.com/forgot-password');
  await page.fill('input[name="email"]', mailbox.address);
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Check your email')).toBeVisible();

  // Wait for reset email and extract link
  console.log('Waiting for password reset email...');
  const resetLink = await mailbox.waitForLink({
    timeout: 30000,
    pattern: /reset-password/,
  });

  console.log(`Received reset link: ${resetLink}`);

  // Follow the reset link
  await page.goto(resetLink);

  // Set new password
  await page.fill('input[name="newPassword"]', 'NewPassword123!');
  await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page.locator('.success-message')).toContainText(
    'Password updated'
  );

  // Try logging in with new password
  await page.goto('https://example.com/login');
  await page.fill('input[name="email"]', mailbox.address);
  await page.fill('input[name="password"]', 'NewPassword123!');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Welcome back')).toBeVisible();

  await mailbox.delete();
});

/**
 * Example: Password reset with OTP code
 */
test('password reset with OTP code', async ({ page }) => {
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  // Create account (simplified)
  // ... setup code ...

  // Request password reset
  await page.goto('https://example.com/forgot-password');
  await page.fill('input[name="email"]', mailbox.address);
  await page.click('button[type="submit"]');

  // Wait for OTP
  console.log('Waiting for reset code...');
  const resetCode = await mailbox.waitForOTP({
    timeout: 30000,
    from: /security@example\.com/,
  });

  console.log(`Received reset code: ${resetCode}`);

  // Enter code
  await page.fill('input[name="resetCode"]', resetCode);
  await page.click('button[type="submit"]');

  // Set new password
  await page.fill('input[name="newPassword"]', 'NewPassword123!');
  await page.fill('input[name="confirmPassword"]', 'NewPassword123!');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();

  await mailbox.delete();
});

/**
 * Example: Test expired reset link
 */
test('handles expired password reset link', async ({ page }) => {
  // This test would simulate an expired token scenario
  // In a real scenario, you might wait for the token to expire
  // or use a mocked expired token

  await page.goto('https://example.com/reset-password?token=expired-token');

  await expect(page.locator('.error')).toContainText('expired');
  await expect(page.locator('a')).toContainText('Request new link');
});
