# Examples

This directory contains working examples of using `@tempyemail/e2e-testing` with various testing frameworks and scenarios.

## 📁 Directory Structure

```
examples/
├── basic/              # Simple Node.js examples
├── playwright/         # Playwright browser testing
├── cypress/            # Cypress E2E testing
├── jest/              # Jest unit/integration testing
└── vitest/            # Vitest testing
```

## 🚀 Running Examples

### Basic Examples (Node.js)

No installation needed - these use the parent package directly:

```bash
cd examples/basic

# Simple mailbox example
node simple.js

# OTP extraction example
node otp-extraction.js

# Webhook example (requires express and ngrok)
npm install express
node webhook.js
```

### Playwright Examples

```bash
cd examples/playwright
npm install
npm test              # Run all tests
npm run test:headed   # Run with browser visible
npm run test:ui       # Run with Playwright UI
```

**Note:** The Playwright examples use `example.com` as a placeholder. You'll need to replace URLs with your actual application for real testing.

### Cypress Examples

```bash
cd examples/cypress
npm install
npm run cy:open      # Open Cypress interactive mode
npm run cy:run       # Run tests headlessly
```

### Jest Examples

```bash
cd examples/jest
npm install
npm test             # Run all tests
npm run test:watch   # Run in watch mode
```

### Vitest Examples

```bash
cd examples/vitest
npm install
npm test             # Run all tests
npm run test:watch   # Run in watch mode
```

## 📚 Example Descriptions

### Basic Examples

#### `simple.js`
Basic usage demonstrating:
- Creating a mailbox
- Waiting for an email
- Displaying email content
- Cleanup

**Usage:**
```bash
node examples/basic/simple.js
# Then send an email to the displayed address
```

#### `otp-extraction.js`
OTP extraction demonstrating:
- Creating a mailbox
- Waiting for an email with OTP
- Extracting various OTP formats
- Error handling

**Usage:**
```bash
node examples/basic/otp-extraction.js
# Send an email with a verification code to test
```

#### `webhook.js`
Real-time webhooks demonstrating:
- Setting up an Express webhook server
- Creating a mailbox with webhook
- Receiving real-time notifications
- Using ngrok for public URL

**Prerequisites:**
```bash
npm install express
npx ngrok http 3000  # In another terminal
```

### Playwright Examples

#### `tests/signup.spec.ts`
Complete signup flow:
- Creating temporary mailbox
- Filling signup form
- Waiting for verification email
- Extracting and entering OTP
- Verifying successful signup

#### `tests/password-reset.spec.ts`
Password reset flows:
- Magic link reset flow
- OTP code reset flow
- Expired token handling

### Cypress Examples

#### `cypress/e2e/signup.cy.ts`
Signup and email verification:
- User signup with email verification
- Form validation
- Resending verification codes
- Expired code handling

#### `cypress/e2e/2fa.cy.ts`
Two-factor authentication:
- Enabling 2FA with email
- 2FA login flow
- Disabling 2FA
- Changing 2FA email

#### `support/commands.ts`
Custom Cypress commands:
- `cy.createMailbox()` - Create mailbox
- `cy.waitForOTP()` - Wait for OTP code
- `cy.waitForLink()` - Wait for link

### Jest Examples

#### `__tests__/email-integration.test.ts`
Comprehensive integration tests:
- Mailbox creation and status
- Email operations
- OTP extraction (various formats)
- Link extraction
- Application integration scenarios

### Vitest Examples

#### `tests/email.test.ts`
Vitest integration tests:
- Client functionality
- OTP parsing
- Link parsing
- Integration scenarios

## 🎯 Use Cases Demonstrated

### Email Verification Flow
See: `playwright/tests/signup.spec.ts`, `cypress/cypress/e2e/signup.cy.ts`

```typescript
const mailbox = await client.createMailbox();
await signupWithEmail(mailbox.address);
const otp = await mailbox.waitForOTP({ timeout: 30000 });
await verifyEmail(otp);
```

### Password Reset
See: `playwright/tests/password-reset.spec.ts`

```typescript
await requestPasswordReset(mailbox.address);
const resetLink = await mailbox.waitForLink({
  pattern: /reset-password/
});
await browser.goto(resetLink);
```

### 2FA Setup
See: `cypress/cypress/e2e/2fa.cy.ts`

```typescript
await enable2FA(mailbox.address);
const code = await mailbox.waitForOTP();
await verify2FA(code);
```

### OTP Extraction
See: `basic/otp-extraction.js`, `jest/__tests__/email-integration.test.ts`

```typescript
// Automatic extraction
const otp = await mailbox.waitForOTP();

// Custom pattern
const pin = await mailbox.waitForOTP({
  pattern: /PIN:\s*(\d{4})/
});
```

### Magic Links
See: `playwright/tests/password-reset.spec.ts`

```typescript
const magicLink = await mailbox.waitForLink({
  pattern: /magic-link/,
  from: /auth@/
});
```

## 🔧 Customizing Examples

### Change Base URL

In Playwright/Cypress configs:

```typescript
// playwright.config.ts
use: {
  baseURL: 'https://your-app.com'
}

// cypress.config.ts
e2e: {
  baseUrl: 'https://your-app.com'
}
```

### Adjust Timeouts

```typescript
// Longer timeout for slow email services
const otp = await mailbox.waitForOTP({ timeout: 60000 });

// Custom polling interval
const email = await mailbox.waitForEmail({
  timeout: 30000,
  pollInterval: 2000  // Check every 2 seconds
});
```

### Filter by Sender

```typescript
const otp = await mailbox.waitForOTP({
  from: /noreply@yourapp\.com/
});
```

### Custom OTP Patterns

```typescript
// 4-digit PIN
const pin = await mailbox.waitForOTP({
  pattern: /PIN:\s*(\d{4})/
});

// Alphanumeric code
const code = await mailbox.waitForOTP({
  pattern: /CODE:\s*([A-Z0-9]{8})/
});
```

## 🐛 Troubleshooting

### "Polling timeout" errors

**Cause:** Email took too long to arrive

**Solution:**
```typescript
// Increase timeout
const email = await mailbox.waitForEmail({ timeout: 60000 });

// Check if email was sent
const messages = await mailbox.getMessages();
console.log(`${messages.length} messages received`);
```

### "No OTP code found" errors

**Cause:** Email format doesn't match expected pattern

**Solution:**
```typescript
// Check email content
const email = await mailbox.waitForEmail();
console.log('Email body:', email.bodyText);

// Use custom pattern
const otp = await mailbox.waitForOTP({
  pattern: /Your code: (\d+)/
});
```

### Examples fail with "example.com" errors

**Cause:** Examples use placeholder URLs

**Solution:** Replace `example.com` with your actual application URL in:
- Playwright config: `playwright.config.ts`
- Cypress config: `cypress.config.ts`
- Test files: Update `goto()` and `visit()` URLs

### Node.js module errors

**Cause:** Node.js version too old

**Solution:**
```bash
node --version  # Should be >= 16.0.0
nvm install 20  # Or install latest LTS
```

## 💡 Best Practices

### 1. Always Clean Up

```typescript
let mailbox;
try {
  mailbox = await client.createMailbox();
  // ... test code ...
} finally {
  if (mailbox) await mailbox.delete();
}
```

### 2. Use Framework Hooks

```typescript
// Playwright
test.afterEach(async () => {
  if (mailbox) await mailbox.delete();
});

// Jest/Vitest
afterEach(async () => {
  if (mailbox) await mailbox.delete();
});
```

### 3. Filter Emails

```typescript
// Only wait for emails from your app
const email = await mailbox.waitForEmail({
  from: /noreply@yourapp\.com/,
  subject: /verification/i
});
```

### 4. Handle Timeouts Gracefully

```typescript
try {
  const otp = await mailbox.waitForOTP({ timeout: 30000 });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Email service might be down');
  }
  throw error;
}
```

## 📖 Further Reading

- [Main README](../README.md) - Full API documentation
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Changelog](../CHANGELOG.md) - Version history

## ❓ Questions?

- Open an issue: https://github.com/TempyEmail/e2e-testing/issues
- Check documentation: https://tempy.email
