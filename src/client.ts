import { TempyEmailConfig, CreateMailboxOptions, CreateMailboxResponse, MailboxStatus } from './types';
import { Mailbox } from './mailbox';

/**
 * Main client for interacting with the tempy.email API
 */
export class TempyEmail {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: TempyEmailConfig = {}) {
    this.baseUrl = config.baseUrl || 'https://tempy.email/api/v1';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Create a new temporary mailbox
   */
  async createMailbox(options: CreateMailboxOptions = {}): Promise<Mailbox> {
    const { webhookUrl, webhookFormat } = options;

    const params = new URLSearchParams();
    if (webhookUrl) {
      params.append('webhookUrl', webhookUrl);
      params.append('webhookFormat', webhookFormat || 'json');
    }

    const url = `${this.baseUrl}/mailbox${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create mailbox: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as CreateMailboxResponse;

    return new Mailbox(
      data.email,
      data.expiresAt,
      data.webhookUrl,
      this.baseUrl,
      this.timeout
    );
  }

  /**
   * Get an existing mailbox by email address
   */
  async getMailbox(address: string): Promise<Mailbox> {
    const response = await fetch(`${this.baseUrl}/mailbox/${address}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get mailbox: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json() as MailboxStatus;

    return new Mailbox(
      data.email,
      data.expiresAt,
      data.webhookUrl,
      this.baseUrl,
      this.timeout
    );
  }
}
