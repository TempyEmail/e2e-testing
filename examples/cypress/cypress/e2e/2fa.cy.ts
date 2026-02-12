/**
 * Cypress example: Two-factor authentication (2FA) with email
 */

import { Mailbox } from '@tempyemail/e2e-testing';

describe('2FA Setup', () => {
  let mailbox: Mailbox;

  before(() => {
    cy.createMailbox().then((m) => {
      mailbox = m;
    });
  });

  after(() => {
    if (mailbox) {
      cy.wrap(mailbox.delete());
    }
  });

  beforeEach(() => {
    // Login first (assumes you have a test account)
    cy.visit('/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();
  });

  it('enables 2FA with email verification', () => {
    // Navigate to security settings
    cy.visit('/settings/security');

    // Enable email 2FA
    cy.get('#email-2fa-toggle').click();

    // Enter email for 2FA
    cy.get('#2fa-email-input').type(mailbox.address);
    cy.get('button').contains('Send Code').click();

    // Wait for verification code
    cy.waitForOTP(mailbox, { timeout: 30000 }).then((otp) => {
      cy.log(`2FA Setup Code: ${otp}`);

      // Enter verification code
      cy.get('input[name="verificationCode"]').type(otp);
      cy.get('button').contains('Verify').click();

      // Verify 2FA is enabled
      cy.get('.success-alert').should('be.visible');
      cy.get('.success-alert').should('contain', '2FA enabled');
    });
  });

  it('requires 2FA code on subsequent logins', () => {
    // First, enable 2FA (using the test above logic)
    cy.visit('/settings/security');
    cy.get('#email-2fa-toggle').click();
    cy.get('#2fa-email-input').type(mailbox.address);
    cy.get('button').contains('Send Code').click();

    cy.waitForOTP(mailbox).then((setupOtp) => {
      cy.get('input[name="verificationCode"]').type(setupOtp);
      cy.get('button').contains('Verify').click();
    });

    // Logout
    cy.get('button[aria-label="Logout"]').click();

    // Login again
    cy.visit('/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    // Should be prompted for 2FA code
    cy.contains('Enter verification code').should('be.visible');

    // Wait for 2FA code
    cy.waitForOTP(mailbox, { timeout: 30000 }).then((loginOtp) => {
      cy.log(`2FA Login Code: ${loginOtp}`);

      cy.get('input[name="2faCode"]').type(loginOtp);
      cy.get('button[type="submit"]').click();

      // Should be logged in
      cy.url().should('include', '/dashboard');
    });
  });
});

describe('2FA Management', () => {
  let mailbox: Mailbox;

  beforeEach(() => {
    cy.createMailbox().then((m) => {
      mailbox = m;
    });

    // Login and enable 2FA
    cy.visit('/login');
    cy.get('input[name="email"]').type('testuser@example.com');
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();
  });

  afterEach(() => {
    if (mailbox) {
      cy.wrap(mailbox.delete());
    }
  });

  it('disables 2FA', () => {
    cy.visit('/settings/security');

    // Disable 2FA
    cy.get('#email-2fa-toggle').click();

    // Confirm with password
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button').contains('Disable 2FA').click();

    // Verify 2FA is disabled
    cy.get('.success-alert').should('contain', '2FA disabled');
  });

  it('changes 2FA email address', () => {
    cy.createMailbox().then((newMailbox) => {
      cy.visit('/settings/security');

      // Click change email
      cy.get('button').contains('Change 2FA Email').click();

      // Enter new email
      cy.get('input[name="new2faEmail"]').type(newMailbox.address);
      cy.get('button').contains('Send Code').click();

      // Verify with code from new email
      cy.waitForOTP(newMailbox, { timeout: 30000 }).then((otp) => {
        cy.get('input[name="verificationCode"]').type(otp);
        cy.get('button').contains('Verify').click();

        cy.get('.success-alert').should('contain', 'Email updated');
      });

      cy.wrap(newMailbox.delete());
    });
  });

  it('handles invalid 2FA codes', () => {
    // Enable 2FA first
    cy.visit('/settings/security');
    cy.get('#email-2fa-toggle').click();
    cy.get('#2fa-email-input').type(mailbox.address);
    cy.get('button').contains('Send Code').click();

    // Enter wrong code
    cy.get('input[name="verificationCode"]').type('000000');
    cy.get('button').contains('Verify').click();

    // Should show error
    cy.get('.error').should('contain', 'Invalid code');
  });
});
