# Quick Reference

One-page reference for common @tempyemail/e2e-testing operations.

## Installation

```bash
npm install @tempyemail/e2e-testing
```

## Basic Usage

```typescript
import { TempyEmail } from '@tempyemail/e2e-testing';

const client = new TempyEmail();
const mailbox = await client.createMailbox();

// Use mailbox.address in your tests
console.log(mailbox.address);

// Wait for email and extract OTP
const otp = await mailbox.waitForOTP({ timeout: 30000 });

// Cleanup
await mailbox.delete();
```

## Common Patterns

### Create & Delete Mailbox

```typescript
// Create
const mailbox = await client.createMailbox();

// With webhook
const mailbox = await client.createMailbox({
  webhookUrl: 'https://example.com/webhook',
  webhookFormat: 'json'
});

// Delete
await mailbox.delete();
```

### Wait for Email

```typescript
// Wait for any email
const email = await mailbox.waitForEmail();

// With timeout
const email = await mailbox.waitForEmail({ timeout: 60000 });

// Filter by subject
const email = await mailbox.waitForEmail({
  subject: 'Welcome',
  timeout: 30000
});

// Filter by sender
const email = await mailbox.waitForEmail({
  from: /noreply@example\.com/,
  timeout: 30000
});

// Both filters
const email = await mailbox.waitForEmail({
  subject: /verification/i,
  from: /auth@/,
  timeout: 30000
});
```

### Extract OTP

```typescript
// Automatic extraction (6-digit, 4-8 digit, alphanumeric, UUID)
const otp = await mailbox.waitForOTP({ timeout: 30000 });

// With sender filter
const otp = await mailbox.waitForOTP({
  from: /security@example\.com/,
  timeout: 30000
});

// Custom pattern
const pin = await mailbox.waitForOTP({
  pattern: /PIN:\s*(\d{4})/,
  timeout: 30000
});

// Manual extraction
const email = await mailbox.waitForEmail();
const otp = extractOTP(email.bodyText);
```

### Extract Links

```typescript
// Wait for verification link
const link = await mailbox.waitForLink({ timeout: 30000 });

// Custom pattern
const resetLink = await mailbox.waitForLink({
  pattern: /reset-password/,
  timeout: 30000
});

// With sender filter
const magicLink = await mailbox.waitForLink({
  pattern: /magic/,
  from: /auth@/,
  timeout: 30000
});

// Manual extraction
const email = await mailbox.waitForEmail();
const link = extractVerificationLink(email.bodyHtml);
```

### Get Messages

```typescript
// Get all messages
const messages = await mailbox.getMessages();

// Check count
console.log(`${messages.length} messages`);

// Access email properties
messages.forEach(email => {
  console.log(`From: ${email.from}`);
  console.log(`Subject: ${email.subject}`);
  console.log(`Body: ${email.bodyText}`);
});
```

### Mailbox Status

```typescript
// Get full status
const status = await mailbox.getStatus();
console.log(status.secondsRemaining);

// Quick checks
const remaining = mailbox.secondsRemaining();
const expired = mailbox.isExpired();

// Properties
console.log(mailbox.address);
console.log(mailbox.expiresAt);
console.log(mailbox.webhookUrl);
```

## Framework Integration

### Playwright

```typescript
import { test } from '@playwright/test';
import { TempyEmail } from '@tempyemail/e2e-testing';

test('signup', async ({ page }) => {
  const client = new TempyEmail();
  const mailbox = await client.createMailbox();

  await page.fill('[name="email"]', mailbox.address);
  // ... submit form ...

  const otp = await mailbox.waitForOTP({ timeout: 30000 });
  await page.fill('[name="code"]', otp);

  await mailbox.delete();
});
```

### Cypress

```typescript
import { TempyEmail } from '@tempyemail/e2e-testing';

it('signup', () => {
  const client = new TempyEmail();

  cy.wrap(client.createMailbox()).then((mailbox) => {
    cy.get('[name="email"]').type(mailbox.address);
    // ... submit ...

    cy.wrap(mailbox.waitForOTP({ timeout: 30000 }))
      .then((otp) => {
        cy.get('[name="code"]').type(otp);
      });

    cy.wrap(mailbox.delete());
  });
});
```

### Jest/Vitest

```typescript
import { TempyEmail, Mailbox } from '@tempyemail/e2e-testing';

let mailbox: Mailbox;

beforeEach(async () => {
  const client = new TempyEmail();
  mailbox = await client.createMailbox();
});

afterEach(async () => {
  await mailbox.delete();
});

test('email received', async () => {
  // Trigger email in your app
  await yourApp.sendEmail(mailbox.address);

  const email = await mailbox.waitForEmail({ timeout: 30000 });
  expect(email.subject).toContain('Welcome');
});
```

## Error Handling

```typescript
try {
  const otp = await mailbox.waitForOTP({ timeout: 30000 });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('Email not received in time');
  } else if (error.message.includes('No OTP code found')) {
    console.error('Email received but no OTP found');
  }
  throw error;
}
```

## Manual Parsers

```typescript
import {
  // OTP
  extract6DigitOTP,
  extractNumericOTP,
  extractAlphanumericOTP,
  extractUUID,
  extractByPattern,
  extractOTP,

  // Links
  extractLinks,
  extractVerificationLink,
  extractLinksByDomain,
  extractFirstLink,

  // Utils
  pollUntil,
  wait
} from '@tempyemail/e2e-testing';

// Extract OTP
const otp = extract6DigitOTP('Your code is 123456');

// Extract links
const links = extractLinks(emailHtml);
const verifyLink = extractVerificationLink(emailHtml);

// Custom polling
const result = await pollUntil(
  async () => checkCondition(),
  { timeout: 30000, interval: 1000 }
);
```

## Configuration

```typescript
// Custom base URL (for self-hosted)
const client = new TempyEmail({
  baseUrl: 'https://custom-api.com/v1'
});

// Custom default timeout
const client = new TempyEmail({
  timeout: 60000  // 60 seconds
});

// Both
const client = new TempyEmail({
  baseUrl: 'https://api.example.com',
  timeout: 45000
});
```

## Best Practices

```typescript
// ✅ Always cleanup
try {
  const mailbox = await client.createMailbox();
  // ... test ...
} finally {
  if (mailbox) await mailbox.delete();
}

// ✅ Use framework hooks
afterEach(async () => {
  if (mailbox) await mailbox.delete();
});

// ✅ Filter by sender
const otp = await mailbox.waitForOTP({
  from: /noreply@yourapp\.com/
});

// ✅ Appropriate timeouts
const email = await mailbox.waitForEmail({
  timeout: 60000  // Adjust based on your email service
});

// ✅ Handle errors
try {
  const otp = await mailbox.waitForOTP({ timeout: 30000 });
} catch (error) {
  // Handle timeout or missing OTP
}
```

## Debugging

```typescript
// Check if email was received
const messages = await mailbox.getMessages();
console.log(`${messages.length} messages in mailbox`);

// Inspect email content
const email = await mailbox.waitForEmail();
console.log('Subject:', email.subject);
console.log('From:', email.from);
console.log('Body:', email.bodyText);

// Check mailbox status
console.log('Expired?', mailbox.isExpired());
console.log('Time left:', mailbox.secondsRemaining());

// Manual OTP extraction with logging
const email = await mailbox.waitForEmail();
console.log('Email body:', email.bodyText);
const otp = extractOTP(email.bodyText);
console.log('Extracted OTP:', otp);
```

## Common Issues

### Email not received
```typescript
// Increase timeout
await mailbox.waitForEmail({ timeout: 60000 });

// Check messages manually
const messages = await mailbox.getMessages();
console.log(`${messages.length} messages`);
```

### OTP not found
```typescript
// Check email content
const email = await mailbox.waitForEmail();
console.log(email.bodyText);

// Use custom pattern
const otp = await mailbox.waitForOTP({
  pattern: /code:\s*(\d+)/i
});
```

### Mailbox expired
```typescript
// Check expiration
if (mailbox.isExpired()) {
  console.log('Mailbox expired, create new one');
  mailbox = await client.createMailbox();
}
```

## Rate Limits

- **Mailbox creation:** Unlimited
- **API requests:** 100 per minute per IP
- **Mailbox lifetime:** 1 hour (automatic cleanup)

## TypeScript Types

```typescript
interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: string;
  messageId?: string;
  direction: 'inbound' | 'outbound';
  isRead: boolean;
  allowReply: boolean;
}

interface MailboxStatus {
  email: string;
  createdAt: string;
  expiresAt: string;
  secondsRemaining: number;
  isExpired: boolean;
  webhookUrl?: string;
  webhookFormat?: 'json' | 'xml';
}
```

## Links

- **Documentation:** [README.md](./README.md)
- **Examples:** [examples/](./examples/)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **npm:** https://www.npmjs.com/package/@tempyemail/e2e-testing
- **Website:** https://tempy.email
