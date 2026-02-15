/**
 * TypeScript types for tempy.email API
 */

export interface Email {
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

export interface MailboxStatus {
  email: string;
  createdAt: string;
  expiresAt: string;
  secondsRemaining: number;
  isExpired: boolean;
  webhookUrl?: string;
  webhookFormat?: 'json' | 'xml';
}

export interface CreateMailboxResponse {
  email: string;
  webUrl: string;
  expiresAt: string;
  secondsRemaining: number;
  webhookUrl?: string;
  webhookFormat?: string;
}

export interface CreateMailboxOptions {
  domain?: string;
  webhookUrl?: string;
  webhookFormat?: 'json' | 'xml';
}

export interface WaitForEmailOptions {
  timeout?: number;
  subject?: string | RegExp;
  from?: string | RegExp;
  pollInterval?: number;
}

export interface WaitForOTPOptions {
  timeout?: number;
  pattern?: RegExp;
  from?: string | RegExp;
}

export interface WaitForLinkOptions {
  timeout?: number;
  pattern?: RegExp;
  from?: string | RegExp;
}

export interface TempyEmailConfig {
  baseUrl?: string;
  timeout?: number;
}

export interface PollOptions {
  timeout?: number;
  interval?: number;
  maxInterval?: number;
  backoff?: boolean;
}
