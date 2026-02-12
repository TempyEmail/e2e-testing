/**
 * Cypress example: User signup with email verification
 */

import { Mailbox } from '@tempyemail/e2e-testing';

describe('User Signup', () => {
  let mailbox: Mailbox;

  beforeEach(() => {
    cy.createMailbox().then((m) => {
      mailbox = m;
      cy.log(`Created mailbox: ${mailbox.address}`);
    });
  });

  afterEach(() => {
    if (mailbox) {
      cy.wrap(mailbox.delete());
    }
  });

  it('completes signup with email verification', () => {
    // Navigate to signup page
    cy.visit('/signup');

    // Fill out form
    cy.get('input[name="email"]').type(mailbox.address);
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('input[name="confirmPassword"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    // Verify we're on the verification page
    cy.contains('Verify your email').should('be.visible');

    // Wait for OTP from email
    cy.waitForOTP(mailbox, { timeout: 30000 }).then((otp) => {
      cy.log(`Received OTP: ${otp}`);

      // Enter verification code
      cy.get('input[name="verificationCode"]').type(otp);
      cy.get('button[type="submit"]').click();

      // Verify success
      cy.get('.success-message').should('be.visible');
      cy.contains('Welcome').should('be.visible');
    });
  });

  it('shows error for invalid email format', () => {
    cy.visit('/signup');

    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    cy.get('.error').should('contain', 'valid email');
  });

  it('validates password strength', () => {
    cy.visit('/signup');

    cy.get('input[name="email"]').type(mailbox.address);
    cy.get('input[name="password"]').type('weak');
    cy.get('button[type="submit"]').click();

    cy.get('.error').should('contain', 'password');
  });
});

describe('Email Verification', () => {
  let mailbox: Mailbox;

  beforeEach(() => {
    cy.createMailbox().then((m) => {
      mailbox = m;
    });
  });

  afterEach(() => {
    if (mailbox) {
      cy.wrap(mailbox.delete());
    }
  });

  it('resends verification email', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type(mailbox.address);
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    // Wait for first email
    cy.waitForOTP(mailbox).then((firstOtp) => {
      cy.log(`First OTP: ${firstOtp}`);

      // Click resend
      cy.contains('Resend code').click();

      // Wait for second email
      cy.waitForOTP(mailbox).then((secondOtp) => {
        cy.log(`Second OTP: ${secondOtp}`);

        // The codes should be different
        expect(secondOtp).not.to.equal(firstOtp);

        // Use the new code
        cy.get('input[name="verificationCode"]').clear().type(secondOtp);
        cy.get('button[type="submit"]').click();

        cy.get('.success-message').should('be.visible');
      });
    });
  });

  it('handles expired verification codes', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type(mailbox.address);
    cy.get('input[name="password"]').type('TestPassword123!');
    cy.get('button[type="submit"]').click();

    // Enter invalid/expired code
    cy.get('input[name="verificationCode"]').type('000000');
    cy.get('button[type="submit"]').click();

    cy.get('.error').should('contain', 'invalid');
  });
});
