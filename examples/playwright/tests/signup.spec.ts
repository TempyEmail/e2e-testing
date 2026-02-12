import { test, expect } from '@playwright/test';
import { TempyEmail } from '@tempyemail/e2e-testing';

/**
 * Example: User signup with email verification
 *
 * This test demonstrates:
 * 1. Creating a temporary mailbox
 * 2. Filling out a signup form with the temp email
 * 3. Waiting for a verification email
 * 4. Extracting the OTP code
 * 5. Completing the verification
 */
test('user signup with email verification', async ({ page }) => {
  // Create temporary mailbox
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  console.log(`Using email: ${mailbox.address}`);

  // Navigate to your signup page
  // NOTE: Replace with your actual signup URL
  const SIGNUP_URL = 'https://example.com/signup';

  await page.goto(SIGNUP_URL);

  // Fill out signup form
  await page.fill('input[name="email"]', mailbox.address);
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for verification page
  await expect(page.locator('text=Verify your email')).toBeVisible();

  // Wait for verification email and extract OTP
  console.log('Waiting for verification email...');
  const otp = await mailbox.waitForOTP({
    timeout: 30000,
    from: /noreply@example\.com/,
  });

  console.log(`Received OTP: ${otp}`);

  // Enter verification code
  await page.fill('input[name="verificationCode"]', otp);
  await page.click('button[type="submit"]');

  // Verify successful signup
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('text=Welcome')).toBeVisible();

  // Cleanup
  await mailbox.delete();
});

/**
 * Example: Test email validation on signup form
 */
test('validates email format on signup', async ({ page }) => {
  await page.goto('https://example.com/signup');

  // Try invalid email
  await page.fill('input[name="email"]', 'not-an-email');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  // Check for validation error
  await expect(page.locator('.error')).toContainText('valid email');
});

/**
 * Example: Test signup with existing email
 */
test('prevents signup with existing email', async ({ page }) => {
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  // First signup - should succeed
  await page.goto('https://example.com/signup');
  await page.fill('input[name="email"]', mailbox.address);
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');

  const otp = await mailbox.waitForOTP({ timeout: 30000 });
  await page.fill('input[name="verificationCode"]', otp);
  await page.click('button[type="submit"]');

  // Logout
  await page.click('button[aria-label="Logout"]');

  // Try to signup again with same email - should fail
  await page.goto('https://example.com/signup');
  await page.fill('input[name="email"]', mailbox.address);
  await page.fill('input[name="password"]', 'DifferentPassword123!');
  await page.click('button[type="submit"]');

  await expect(page.locator('.error')).toContainText('already exists');

  await mailbox.delete();
});
