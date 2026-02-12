/**
 * Custom Cypress commands for email testing
 */

import { TempyEmail, Mailbox } from '@tempyemail/e2e-testing';

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Create a temporary mailbox
       * @example cy.createMailbox().then((mailbox) => { ... })
       */
      createMailbox(): Chainable<Mailbox>;

      /**
       * Wait for OTP from mailbox
       * @example cy.waitForOTP(mailbox, { timeout: 30000 })
       */
      waitForOTP(
        mailbox: Mailbox,
        options?: { timeout?: number; from?: string | RegExp }
      ): Chainable<string>;

      /**
       * Wait for verification link from mailbox
       * @example cy.waitForLink(mailbox, { pattern: /verify/ })
       */
      waitForLink(
        mailbox: Mailbox,
        options?: { timeout?: number; pattern?: RegExp }
      ): Chainable<string>;
    }
  }
}

// Create mailbox command
Cypress.Commands.add('createMailbox', () => {
  return cy.wrap(
    (async () => {
      const client = new TempyEmail();
      return await client.createMailbox();
    })(),
    { log: true }
  );
});

// Wait for OTP command
Cypress.Commands.add('waitForOTP', (mailbox: Mailbox, options = {}) => {
  return cy.wrap(mailbox.waitForOTP(options), { log: true, timeout: options.timeout || 30000 });
});

// Wait for link command
Cypress.Commands.add('waitForLink', (mailbox: Mailbox, options = {}) => {
  return cy.wrap(mailbox.waitForLink(options), { log: true, timeout: options.timeout || 30000 });
});

export {};
