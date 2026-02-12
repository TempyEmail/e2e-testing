# @tempyemail/e2e-testing

> JavaScript/TypeScript client for [tempy.email](https://tempy.email) - Temporary email addresses for automated E2E testing

[![npm version](https://img.shields.io/npm/v/@tempyemail/e2e-testing.svg)](https://www.npmjs.com/package/@tempyemail/e2e-testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Perfect for testing:**
- Email verification flows (signup, 2FA, password reset)
- OTP/verification code extraction
- Magic link authentication
- Email-triggered workflows
- Notification systems

**No authentication required** - fully public API with automatic cleanup.

---

## 📦 Installation

```bash
npm install @tempyemail/e2e-testing
```

Or with other package managers:

```bash
yarn add @tempyemail/e2e-testing
pnpm add @tempyemail/e2e-testing
```

---

## 🚀 Quick Start

```typescript
import { TempyEmail } from '@tempyemail/e2e-testing';

// Create client
const client = new TempyEmail();

// Create a temporary mailbox
const mailbox = await client.createMailbox();
console.log(`Email: ${mailbox.address}`);

// Wait for an email
const email = await mailbox.waitForEmail({ timeout: 30000 });
console.log(`Received: ${email.subject}`);

// Extract OTP code
const otp = await mailbox.waitForOTP({ timeout: 30000 });
console.log(`OTP: ${otp}`);

// Cleanup
await mailbox.delete();
```

---

## 📚 API Reference

### TempyEmail

Main client class for interacting with the API.

#### Constructor

```typescript
new TempyEmail(config?: {
  baseUrl?: string;    // Default: 'https://tempy.email/api/v1'
  timeout?: number;    // Default: 30000 (30 seconds)
})
```

#### Methods

##### `createMailbox(options?)`

Create a new temporary mailbox.

```typescript
const mailbox = await client.createMailbox({
  webhookUrl?: string;           // Optional webhook URL
  webhookFormat?: 'json' | 'xml'; // Default: 'json'
});
```

**Returns:** `Promise<Mailbox>`

##### `getMailbox(address)`

Get an existing mailbox by email address.

```typescript
const mailbox = await client.getMailbox('abc123@tempy.email');
```

**Returns:** `Promise<Mailbox>`

---

### Mailbox

Represents a temporary email inbox with helper methods.

#### Properties

- `address: string` - The email address
- `expiresAt: Date` - When the mailbox expires
- `webhookUrl?: string` - Webhook URL if configured

#### Methods

##### `getMessages()`

Get all messages in the mailbox.

```typescript
const messages = await mailbox.getMessages();
```

**Returns:** `Promise<Email[]>`

##### `waitForEmail(options?)`

Wait for a new email matching the specified criteria.

```typescript
const email = await mailbox.waitForEmail({
  timeout?: number;              // Default: 30000ms
  subject?: string | RegExp;     // Filter by subject
  from?: string | RegExp;        // Filter by sender
  pollInterval?: number;         // Default: 1000ms
});
```

**Returns:** `Promise<Email>`

**Example:**

```typescript
// Wait for any email
const email = await mailbox.waitForEmail();

// Wait for email from specific sender
const email = await mailbox.waitForEmail({
  from: /noreply@example\.com/
});

// Wait for email with specific subject
const email = await mailbox.waitForEmail({
  subject: 'Welcome',
  timeout: 60000
});
```

##### `waitForOTP(options?)`

Wait for an email and extract an OTP code.

```typescript
const otp = await mailbox.waitForOTP({
  timeout?: number;         // Default: 30000ms
  pattern?: RegExp;         // Custom OTP pattern
  from?: string | RegExp;   // Filter by sender
});
```

**Returns:** `Promise<string>`

**Automatically extracts:**
- 6-digit codes (e.g., `123456`)
- 4-8 digit codes
- Alphanumeric codes (e.g., `ABC123`)
- UUID tokens

**Example:**

```typescript
// Extract any common OTP format
const otp = await mailbox.waitForOTP({ timeout: 30000 });

// Custom pattern
const otp = await mailbox.waitForOTP({
  pattern: /PIN:\s*(\d{4})/
});
```

##### `waitForLink(options?)`

Wait for an email and extract a verification/magic link.

```typescript
const link = await mailbox.waitForLink({
  timeout?: number;         // Default: 30000ms
  pattern?: RegExp;         // Custom link pattern
  from?: string | RegExp;   // Filter by sender
});
```

**Returns:** `Promise<string>`

**Example:**

```typescript
// Extract verification link
const link = await mailbox.waitForLink({
  pattern: /verify/i
});

// Extract password reset link
const resetLink = await mailbox.waitForLink({
  pattern: /reset-password/,
  from: /security@/
});
```

##### `markAsRead(emailIds)`

Mark emails as read.

```typescript
await mailbox.markAsRead(['email-id-1', 'email-id-2']);
```

##### `delete()`

Delete the mailbox.

```typescript
await mailbox.delete();
```

##### `getStatus()`

Get mailbox status.

```typescript
const status = await mailbox.getStatus();
console.log(`Expires: ${status.expiresAt}`);
console.log(`Time remaining: ${status.secondsRemaining}s`);
```

##### `isExpired()`

Check if mailbox has expired.

```typescript
if (mailbox.isExpired()) {
  console.log('Mailbox expired');
}
```

##### `secondsRemaining()`

Get seconds remaining until expiration.

```typescript
const remaining = mailbox.secondsRemaining();
console.log(`${remaining}s remaining`);
```

---

## 🎭 Framework Integration

### Playwright

```typescript
import { test, expect } from '@playwright/test';
import { TempyEmail } from '@tempyemail/e2e-testing';

test('user signup with verification', async ({ page }) => {
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  // Fill signup form
  await page.goto('https://example.com/signup');
  await page.fill('[name="email"]', mailbox.address);
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // Wait for OTP
  const otp = await mailbox.waitForOTP({ timeout: 30000 });

  // Enter OTP
  await page.fill('[name="code"]', otp);
  await page.click('button[type="submit"]');

  // Verify success
  await expect(page.locator('.success')).toBeVisible();

  await mailbox.delete();
});
```

### Cypress

```typescript
import { TempyEmail } from '@tempyemail/e2e-testing';

describe('Signup', () => {
  it('completes email verification', () => {
    const client = new TempyEmail();

    cy.wrap(client.createMailbox()).then((mailbox) => {
      cy.visit('/signup');
      cy.get('[name="email"]').type(mailbox.address);
      cy.get('[name="password"]').type('Password123!');
      cy.get('button[type="submit"]').click();

      // Wait for OTP
      cy.wrap(mailbox.waitForOTP({ timeout: 30000 })).then((otp) => {
        cy.get('[name="code"]').type(otp);
        cy.get('button[type="submit"]').click();
        cy.get('.success').should('be.visible');
      });

      cy.wrap(mailbox.delete());
    });
  });
});
```

### Jest

```typescript
import { TempyEmail } from '@tempyemail/e2e-testing';

describe('Email Integration', () => {
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

  it('receives welcome email', async () => {
    // Trigger email in your app
    await yourApp.sendWelcomeEmail(mailbox.address);

    const email = await mailbox.waitForEmail({
      subject: /welcome/i,
      timeout: 30000
    });

    expect(email.subject).toContain('Welcome');
  });
});
```

### Vitest

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TempyEmail, Mailbox } from '@tempyemail/e2e-testing';

describe('Password Reset', () => {
  let mailbox: Mailbox;

  beforeEach(async () => {
    const client = new TempyEmail();
    mailbox = await client.createMailbox();
  });

  afterEach(async () => {
    await mailbox.delete();
  });

  it('sends reset link', async () => {
    await yourApp.requestPasswordReset(mailbox.address);

    const link = await mailbox.waitForLink({
      pattern: /reset-password/,
      timeout: 30000
    });

    expect(link).toMatch(/^https:\/\//);
  });
});
```

---

## 🔍 Extracting OTP Codes

The library automatically extracts common OTP formats:

```typescript
// 6-digit codes
"Your code is 123456" → "123456"

// Codes with formatting
"Code: 987-654" → "987654"

// Alphanumeric codes
"Token: ABC123" → "ABC123"

// UUID tokens
"Token: 550e8400-e29b-41d4-a716-446655440000" → "550e8400-..."
```

### Custom OTP Patterns

```typescript
// Extract 4-digit PIN
const pin = await mailbox.waitForOTP({
  pattern: /PIN:\s*(\d{4})/
});

// Extract specific format
const code = await mailbox.waitForOTP({
  pattern: /CODE:\s*([A-Z0-9]{8})/
});
```

### Manual Extraction

```typescript
import {
  extract6DigitOTP,
  extractNumericOTP,
  extractAlphanumericOTP,
  extractUUID,
  extractByPattern
} from '@tempyemail/e2e-testing';

// From email text
const email = await mailbox.waitForEmail();
const otp = extract6DigitOTP(email.bodyText);
```

---

## 🔗 Extracting Links

Extract verification and magic links from emails:

```typescript
// Wait for verification link
const link = await mailbox.waitForLink();

// Custom pattern
const magicLink = await mailbox.waitForLink({
  pattern: /magic-link/
});

// From specific sender
const resetLink = await mailbox.waitForLink({
  pattern: /reset/,
  from: /security@example\.com/
});
```

### Manual Link Extraction

```typescript
import {
  extractLinks,
  extractVerificationLink,
  extractLinksByDomain,
  extractFirstLink
} from '@tempyemail/e2e-testing';

const email = await mailbox.waitForEmail();

// All links
const allLinks = extractLinks(email.bodyHtml);

// Verification links only
const verifyLink = extractVerificationLink(email.bodyHtml);

// Links from specific domain
const appLinks = extractLinksByDomain(email.bodyHtml, 'example.com');

// First link
const firstLink = extractFirstLink(email.bodyText);
```

---

## 🪝 Using Webhooks

Receive real-time notifications when emails arrive:

```typescript
const mailbox = await client.createMailbox({
  webhookUrl: 'https://your-server.com/webhook',
  webhookFormat: 'json'
});

console.log(`Webhook configured: ${mailbox.webhookUrl}`);
```

**Webhook payload:**

```json
{
  "id": "msg_abc123",
  "from": "sender@example.com",
  "to": "abc123@tempy.email",
  "subject": "Verification Code",
  "bodyText": "Your code is 123456",
  "bodyHtml": "<p>Your code is <b>123456</b></p>",
  "receivedAt": "2025-01-15T10:30:00Z",
  "direction": "inbound",
  "isRead": false,
  "allowReply": true
}
```

**Testing webhooks locally:**

```bash
# Expose local server with ngrok
npx ngrok http 3000

# Use ngrok URL as webhook
const mailbox = await client.createMailbox({
  webhookUrl: 'https://abc123.ngrok.io/webhook'
});
```

---

## 💡 Best Practices

### 1. Always Clean Up

```typescript
let mailbox: Mailbox;

try {
  mailbox = await client.createMailbox();
  // ... your test ...
} finally {
  if (mailbox) {
    await mailbox.delete();
  }
}
```

### 2. Use Appropriate Timeouts

```typescript
// Quick operations
const email = await mailbox.waitForEmail({ timeout: 10000 });

// Slower email services
const email = await mailbox.waitForEmail({ timeout: 60000 });
```

### 3. Filter by Sender

```typescript
// Only accept emails from your app
const otp = await mailbox.waitForOTP({
  from: /noreply@yourapp\.com/
});
```

### 4. Handle Timeouts Gracefully

```typescript
try {
  const otp = await mailbox.waitForOTP({ timeout: 30000 });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('Email not received - check email service');
  }
  throw error;
}
```

### 5. Reuse Mailboxes When Possible

```typescript
// Good: One mailbox for entire test
const mailbox = await client.createMailbox();
await testSignup(mailbox);
await testVerification(mailbox);
await mailbox.delete();

// Avoid: Creating multiple mailboxes unnecessarily
```

---

## ⚡ Rate Limits

The tempy.email API has the following limits:

- **Mailbox creation:** Unlimited
- **API requests:** 100 per minute per IP
- **Mailbox lifetime:** 1 hour (automatic cleanup)
- **Message retention:** Deleted when mailbox expires

No authentication required - fully public API.

---

## 🐛 Troubleshooting

### "Polling timeout" error

```typescript
// Increase timeout
const email = await mailbox.waitForEmail({ timeout: 60000 });

// Check if email was actually sent
const messages = await mailbox.getMessages();
console.log(`${messages.length} messages in mailbox`);
```

### "No OTP code found" error

```typescript
// Use custom pattern
const otp = await mailbox.waitForOTP({
  pattern: /code:\s*(\d+)/i
});

// Or extract manually
const email = await mailbox.waitForEmail();
console.log('Email body:', email.bodyText);
```

### "Failed to create mailbox" error

- Check your internet connection
- Verify tempy.email is accessible
- Check for rate limiting (100 requests/minute)

### Emails not arriving

- Wait longer (increase timeout)
- Check spam/junk folder in your email service
- Verify the email was actually sent from your app
- Check mailbox hasn't expired (`mailbox.isExpired()`)

---

## 📖 Examples

Complete working examples are available in the [`examples/`](./examples) directory:

- **[Basic](./examples/basic/)** - Simple Node.js examples
- **[Playwright](./examples/playwright/)** - Browser testing with Playwright
- **[Cypress](./examples/cypress/)** - E2E testing with Cypress
- **[Jest](./examples/jest/)** - Unit/integration testing with Jest
- **[Vitest](./examples/vitest/)** - Testing with Vitest

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/TempyEmail/e2e-testing).

---

## 📄 License

MIT © TempyEmail

---

## 🔗 Links

- **Website:** https://tempy.email
- **GitHub:** https://github.com/TempyEmail/e2e-testing
- **npm:** https://www.npmjs.com/package/@tempyemail/e2e-testing
- **Issues:** https://github.com/TempyEmail/e2e-testing/issues

---

## 🌟 Why tempy.email?

- ✅ **No authentication** - Just create and use
- ✅ **Automatic cleanup** - Mailboxes expire after 1 hour
- ✅ **Real emails** - Full SMTP support, not mocked
- ✅ **Webhook support** - Real-time notifications
- ✅ **Smart parsing** - Automatic OTP and link extraction
- ✅ **Framework agnostic** - Works with any testing framework
- ✅ **TypeScript native** - Full type safety
- ✅ **Zero configuration** - Works out of the box

Perfect for CI/CD pipelines, automated testing, and development workflows.
