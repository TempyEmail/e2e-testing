# Getting Started with @tempyemail/e2e-testing

Welcome! This guide will get you up and running in 5 minutes.

## Step 1: Install

```bash
npm install @tempyemail/e2e-testing
```

## Step 2: Create Your First Test

### Option A: Playwright

```typescript
import { test } from '@playwright/test';
import { TempyEmail } from '@tempyemail/e2e-testing';

test('signup flow', async ({ page }) => {
  // Create temporary email
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();
  console.log(`Test email: ${mailbox.address}`);

  // Use in your signup form
  await page.goto('https://yourapp.com/signup');
  await page.fill('[name="email"]', mailbox.address);
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');

  // Wait for verification email and extract code
  const otp = await mailbox.waitForOTP({ timeout: 30000 });
  console.log(`Received OTP: ${otp}`);

  // Complete verification
  await page.fill('[name="code"]', otp);
  await page.click('button[type="submit"]');

  // Cleanup
  await mailbox.delete();
});
```

### Option B: Cypress

```typescript
import { TempyEmail } from '@tempyemail/e2e-testing';

describe('Signup', () => {
  it('completes email verification', () => {
    const client = new TempyEmail();

    cy.wrap(client.createMailbox()).then((mailbox) => {
      // Use in signup
      cy.visit('/signup');
      cy.get('[name="email"]').type(mailbox.address);
      cy.get('[name="password"]').type('TestPass123!');
      cy.get('button[type="submit"]').click();

      // Wait for OTP
      cy.wrap(mailbox.waitForOTP({ timeout: 30000 })).then((otp) => {
        cy.get('[name="code"]').type(otp);
        cy.get('button[type="submit"]').click();
        cy.contains('Welcome').should('be.visible');
      });

      // Cleanup
      cy.wrap(mailbox.delete());
    });
  });
});
```

### Option C: Jest/Vitest

```typescript
import { TempyEmail, Mailbox } from '@tempyemail/e2e-testing';

describe('Email Tests', () => {
  let client: TempyEmail;
  let mailbox: Mailbox;

  beforeAll(() => {
    client = new TempyEmail();
  });

  beforeEach(async () => {
    mailbox = await client.createMailbox();
  });

  afterEach(async () => {
    await mailbox.delete();
  });

  test('receives welcome email', async () => {
    // Trigger email in your app
    await yourApp.sendWelcomeEmail(mailbox.address);

    // Wait for email
    const email = await mailbox.waitForEmail({
      subject: /welcome/i,
      timeout: 30000
    });

    expect(email.subject).toContain('Welcome');
  });
});
```

## Step 3: Try Common Scenarios

### Password Reset

```typescript
// Request password reset
await yourApp.requestReset(mailbox.address);

// Extract reset link
const resetLink = await mailbox.waitForLink({
  pattern: /reset-password/,
  timeout: 30000
});

// Use the link
await page.goto(resetLink);
```

### 2FA Setup

```typescript
// Enable 2FA
await yourApp.enable2FA(mailbox.address);

// Get verification code
const code = await mailbox.waitForOTP({
  from: /security@yourapp\.com/,
  timeout: 30000
});

// Verify
await yourApp.verify2FA(code);
```

### Magic Link

```typescript
// Request magic link
await yourApp.requestMagicLink(mailbox.address);

// Get link
const magicLink = await mailbox.waitForLink({
  pattern: /magic/,
  timeout: 30000
});

// Use it
await page.goto(magicLink);
```

## Step 4: Understand the Basics

### Creating Mailboxes

```typescript
const client = new TempyEmail();
const mailbox = await client.createMailbox();

// Mailbox address: mailbox.address
// Expires at: mailbox.expiresAt
// Time left: mailbox.secondsRemaining()
```

### Waiting for Emails

```typescript
// Wait for any email
const email = await mailbox.waitForEmail();

// Wait with filters
const email = await mailbox.waitForEmail({
  subject: 'Welcome',
  from: /noreply@/,
  timeout: 30000
});
```

### Extracting OTPs

```typescript
// Automatic extraction (works with most formats)
const otp = await mailbox.waitForOTP({ timeout: 30000 });

// Custom pattern
const pin = await mailbox.waitForOTP({
  pattern: /PIN:\s*(\d{4})/,
  timeout: 30000
});
```

### Extracting Links

```typescript
// Any verification link
const link = await mailbox.waitForLink({ timeout: 30000 });

// Specific pattern
const resetLink = await mailbox.waitForLink({
  pattern: /reset-password/,
  timeout: 30000
});
```

### Cleanup

```typescript
// Always cleanup when done
await mailbox.delete();

// Or use try/finally
try {
  // ... test code ...
} finally {
  await mailbox.delete();
}
```

## Step 5: Explore Examples

Check out the [`examples/`](./examples/) directory for complete working examples:

- **[Basic Node.js](./examples/basic/)** - Simple examples
- **[Playwright](./examples/playwright/)** - Browser testing
- **[Cypress](./examples/cypress/)** - E2E testing
- **[Jest](./examples/jest/)** - Unit/integration tests
- **[Vitest](./examples/vitest/)** - Modern testing

## Common Patterns

### Setup/Teardown

```typescript
// Playwright
test.beforeEach(async () => {
  mailbox = await client.createMailbox();
});

test.afterEach(async () => {
  await mailbox.delete();
});

// Jest/Vitest
beforeEach(async () => {
  mailbox = await client.createMailbox();
});

afterEach(async () => {
  await mailbox.delete();
});
```

### Error Handling

```typescript
try {
  const otp = await mailbox.waitForOTP({ timeout: 30000 });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Email not received - check your email service');
  }
  throw error;
}
```

### Debugging

```typescript
// Check if emails arrived
const messages = await mailbox.getMessages();
console.log(`${messages.length} emails received`);

// Inspect email content
const email = await mailbox.waitForEmail();
console.log('Subject:', email.subject);
console.log('From:', email.from);
console.log('Body:', email.bodyText);
```

## Tips & Best Practices

### ✅ DO

- Always delete mailboxes when done
- Use appropriate timeouts (30-60 seconds)
- Filter emails by sender to avoid false matches
- Handle timeout errors gracefully
- Reuse mailboxes across multiple test steps

### ❌ DON'T

- Create multiple mailboxes when one will do
- Use very short timeouts (< 10 seconds)
- Forget to cleanup mailboxes
- Ignore timeout errors without investigating

## Troubleshooting

### "Polling timeout" error

**Solution:** Increase timeout or check if email was sent

```typescript
const email = await mailbox.waitForEmail({ timeout: 60000 });
```

### "No OTP code found" error

**Solution:** Check email format or use custom pattern

```typescript
const email = await mailbox.waitForEmail();
console.log('Email body:', email.bodyText);

const otp = await mailbox.waitForOTP({
  pattern: /code:\s*(\d+)/i
});
```

### Emails not arriving

**Solution:** Check your email service logs and increase timeout

```typescript
// Wait longer
const email = await mailbox.waitForEmail({ timeout: 60000 });

// Check manually
const messages = await mailbox.getMessages();
console.log(`${messages.length} messages in mailbox`);
```

## Next Steps

1. **Read the full documentation:** [README.md](./README.md)
2. **Try the examples:** [examples/](./examples/)
3. **Check the API reference:** [README.md#api-reference](./README.md#-api-reference)
4. **See the quick reference:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

## Need Help?

- **Issues:** https://github.com/TempyEmail/e2e-testing/issues
- **Documentation:** [README.md](./README.md)
- **Website:** https://tempy.email

---

Happy testing! 🎉
