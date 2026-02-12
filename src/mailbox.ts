import {
  Email,
  MailboxStatus,
  WaitForEmailOptions,
  WaitForOTPOptions,
  WaitForLinkOptions,
} from './types';
import { pollUntil } from './utils/polling';
import { extractOTP, extractByPattern } from './parsers/otp';
import { extractVerificationLink } from './parsers/links';

export class Mailbox {
  public readonly address: string;
  public readonly expiresAt: Date;
  public readonly webhookUrl?: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    address: string,
    expiresAt: string,
    webhookUrl: string | undefined,
    baseUrl: string,
    timeout: number
  ) {
    this.address = address;
    this.expiresAt = new Date(expiresAt);
    this.webhookUrl = webhookUrl;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get all messages in the mailbox
   */
  async getMessages(): Promise<Email[]> {
    const response = await fetch(`${this.baseUrl}/mailbox/${this.address}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get messages: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as { emails: Email[] };
    return data.emails || [];
  }

  /**
   * Wait for a new email matching the specified criteria
   */
  async waitForEmail(options: WaitForEmailOptions = {}): Promise<Email> {
    const {
      timeout = this.timeout,
      subject,
      from,
      pollInterval = 1000,
    } = options;

    const email = await pollUntil(
      async () => {
        const messages = await this.getMessages();

        for (const message of messages) {
          // Check subject filter
          if (subject) {
            const subjectMatches =
              typeof subject === 'string'
                ? message.subject.includes(subject)
                : subject.test(message.subject);
            if (!subjectMatches) continue;
          }

          // Check from filter
          if (from) {
            const fromMatches =
              typeof from === 'string'
                ? message.from.includes(from)
                : from.test(message.from);
            if (!fromMatches) continue;
          }

          return message;
        }

        return null;
      },
      { timeout, interval: pollInterval, backoff: true }
    );

    return email;
  }

  /**
   * Wait for an email and extract an OTP code from it
   */
  async waitForOTP(options: WaitForOTPOptions = {}): Promise<string> {
    const { timeout = this.timeout, pattern, from } = options;

    const email = await this.waitForEmail({ timeout, from });

    // Extract OTP from email body
    const otp = pattern
      ? extractByPattern(email.bodyText, pattern)
      : extractOTP(email.bodyText);

    if (!otp) {
      throw new Error(
        `No OTP code found in email. Subject: "${email.subject}"`
      );
    }

    return otp;
  }

  /**
   * Wait for an email and extract a verification link from it
   */
  async waitForLink(options: WaitForLinkOptions = {}): Promise<string> {
    const { timeout = this.timeout, pattern, from } = options;

    const email = await this.waitForEmail({ timeout, from });

    // Extract link from email body (prefer HTML, fallback to text)
    const body = email.bodyHtml || email.bodyText;
    const link = extractVerificationLink(body, pattern);

    if (!link) {
      throw new Error(
        `No verification link found in email. Subject: "${email.subject}"`
      );
    }

    return link;
  }

  /**
   * Mark emails as read
   */
  async markAsRead(emailIds: string[]): Promise<void> {
    for (const id of emailIds) {
      const response = await fetch(
        `${this.baseUrl}/mailbox/${this.address}/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ isRead: true }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark email as read: ${response.status} ${response.statusText}`
        );
      }
    }
  }

  /**
   * Delete the mailbox
   */
  async delete(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/mailbox/${this.address}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete mailbox: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Get mailbox status
   */
  async getStatus(): Promise<MailboxStatus> {
    const response = await fetch(`${this.baseUrl}/mailbox/${this.address}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get mailbox status: ${response.status} ${response.statusText}`
      );
    }

    return await response.json() as MailboxStatus;
  }

  /**
   * Check if the mailbox has expired
   */
  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  /**
   * Get seconds remaining until expiration
   */
  secondsRemaining(): number {
    const remaining = Math.floor(
      (this.expiresAt.getTime() - Date.now()) / 1000
    );
    return Math.max(0, remaining);
  }
}
