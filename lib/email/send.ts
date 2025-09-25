import React from 'react';
import { Resend } from 'resend';
import { eq } from 'drizzle-orm';

import { WelcomeEmail, type WelcomeEmailProps } from '@/emails/templates/WelcomeEmail';
import { welcomeEmailText } from '@/emails/templates/WelcomeEmail.text';
import {
  PasswordResetEmail,
  type PasswordResetEmailProps,
} from '@/emails/templates/PasswordResetEmail';
import { passwordResetEmailText } from '@/emails/templates/PasswordResetEmail.text';
import {
  PayoutConfirmationEmail,
  type PayoutConfirmationEmailProps,
} from '@/emails/templates/PayoutConfirmationEmail';
import { payoutConfirmationEmailText } from '@/emails/templates/PayoutConfirmationEmail.text';
import {
  ChargebackAlertEmail,
  type ChargebackAlertEmailProps,
} from '@/emails/templates/ChargebackAlertEmail';
import { chargebackAlertEmailText } from '@/emails/templates/ChargebackAlertEmail.text';
import {
  ExportReadyEmail,
  type ExportReadyEmailProps,
} from '@/emails/templates/ExportReadyEmail';
import { exportReadyEmailText } from '@/emails/templates/ExportReadyEmail.text';
import { emails as emailTable } from '@/db/schema/email';
import { db } from '@/lib/db/drizzle';

export type EmailTemplateId =
  | 'welcome'
  | 'password-reset'
  | 'payout-confirmation'
  | 'chargeback-alert'
  | 'export-ready';

export interface SendEmailOptions {
  template: EmailTemplateId;
  to: string;
  subject: string;
  react: React.ReactElement;
  text: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  tenantId?: string;
  broadcastId?: string | null;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
}

type ResendSendReturn = Awaited<ReturnType<Resend['emails']['send']>>;
type ResendSendData = ResendSendReturn['data'];

const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

function ensureResendClient(): Resend {
  if (!resendClient) {
    throw new Error('Resend client is not configured. Set RESEND_API_KEY.');
  }

  return resendClient;
}

function ensureFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not configured.');
  }

  return from;
}

function ensureNonEmpty(value: string | null | undefined, field: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function ensureFinite(value: number | null | undefined, field: string): number {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number.`);
  }

  return value;
}

async function dispatchEmail(options: SendEmailOptions): Promise<ResendSendData> {
  const client = ensureResendClient();
  const from = ensureFromAddress();
  const to = ensureNonEmpty(options.to, 'Recipient email');
  const subject = ensureNonEmpty(options.subject, 'Subject');
  const text = ensureNonEmpty(options.text, 'Plaintext body');
  const metadata =
    options.metadata ??
    (options.tags?.length ? { tags: options.tags } : null);

  let emailRecordId: string | null = null;

  try {
    const [record] = await db
      .insert(emailTable)
      .values({
        template: options.template,
        subject,
        to,
        from,
        replyTo: options.replyTo ?? from,
        tenantId: options.tenantId ?? null,
        broadcastId: options.broadcastId ?? null,
        payload: options.payload ?? null,
        metadata,
        status: 'queued',
      })
      .returning({ id: emailTable.id });

    emailRecordId = record?.id ?? null;
  } catch (error) {
    console.error('Failed to persist email metadata', error);
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to,
      subject,
      react: options.react,
      text,
      reply_to: options.replyTo ?? from,
      tags:
        options.tags ?? [{ name: 'template', value: options.template }],
    });

    if (error) {
      throw new Error(
        `Failed to send ${options.template} email: ${error.message}`
      );
    }

    if (emailRecordId) {
      try {
        await db
          .update(emailTable)
          .set({
            status: 'sent',
            providerId: data?.id ?? null,
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(emailTable.id, emailRecordId));
      } catch (updateError) {
        console.error('Failed to update email status', updateError);
      }
    }

    return data;
  } catch (error) {
    if (emailRecordId) {
      try {
        await db
          .update(emailTable)
          .set({
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
            updatedAt: new Date(),
          })
          .where(eq(emailTable.id, emailRecordId));
      } catch (updateError) {
        console.error('Failed to flag email failure', updateError);
      }
    }

    throw error;
  }
}

export async function sendWelcomeEmail({
  to,
  userName,
  verifyUrl,
}: { to: string } & Pick<WelcomeEmailProps, 'userName' | 'verifyUrl'>): Promise<ResendSendData> {
  ensureNonEmpty(userName, 'userName');
  ensureNonEmpty(verifyUrl, 'verifyUrl');

  return dispatchEmail({
    template: 'welcome',
    to,
    subject: 'Welcome to DeelRxCRM – Verify Your Email',
    react: React.createElement(WelcomeEmail, { userName, verifyUrl }),
    text: welcomeEmailText({ userName, verifyUrl }),
    payload: { userName, verifyUrl },
  });
}

export async function sendPasswordResetEmail({
  to,
  userName,
  resetUrl,
  expiresIn,
}: { to: string } & PasswordResetEmailProps): Promise<ResendSendData> {
  ensureNonEmpty(userName, 'userName');
  ensureNonEmpty(resetUrl, 'resetUrl');
  ensureNonEmpty(expiresIn, 'expiresIn');

  return dispatchEmail({
    template: 'password-reset',
    to,
    subject: 'DeelRxCRM Password Reset Request',
    react: React.createElement(PasswordResetEmail, {
      userName,
      resetUrl,
      expiresIn,
    }),
    text: passwordResetEmailText({ userName, resetUrl, expiresIn }),
    payload: { userName, resetUrl, expiresIn },
  });
}

export async function sendPayoutConfirmationEmail({
  to,
  userName,
  amount,
  currency,
  paymentMethod,
  expectedDate,
  transactionId,
}: { to: string } & PayoutConfirmationEmailProps): Promise<ResendSendData> {
  ensureNonEmpty(userName, 'userName');
  ensureNonEmpty(amount, 'amount');
  ensureNonEmpty(currency, 'currency');
  ensureNonEmpty(paymentMethod, 'paymentMethod');
  ensureNonEmpty(expectedDate, 'expectedDate');
  ensureNonEmpty(transactionId, 'transactionId');

  return dispatchEmail({
    template: 'payout-confirmation',
    to,
    subject: `Payout Confirmed: ${currency} ${amount} - DeelRxCRM`,
    react: React.createElement(PayoutConfirmationEmail, {
      userName,
      amount,
      currency,
      paymentMethod,
      expectedDate,
      transactionId,
    }),
    text: payoutConfirmationEmailText({
      userName,
      amount,
      currency,
      paymentMethod,
      expectedDate,
      transactionId,
    }),
    payload: {
      userName,
      amount,
      currency,
      paymentMethod,
      expectedDate,
      transactionId,
    },
  });
}

export async function sendChargebackAlertEmail({
  to,
  userName,
  amount,
  currency,
  caseId,
  disputeUrl,
  dueDate,
  customerInfo,
}: { to: string } & ChargebackAlertEmailProps): Promise<ResendSendData> {
  ensureNonEmpty(userName, 'userName');
  ensureNonEmpty(amount, 'amount');
  ensureNonEmpty(currency, 'currency');
  ensureNonEmpty(caseId, 'caseId');
  ensureNonEmpty(disputeUrl, 'disputeUrl');
  ensureNonEmpty(dueDate, 'dueDate');
  ensureNonEmpty(customerInfo, 'customerInfo');

  return dispatchEmail({
    template: 'chargeback-alert',
    to,
    subject: `🚨 URGENT: Chargeback Alert - ${currency} ${amount} - Action Required`,
    react: React.createElement(ChargebackAlertEmail, {
      userName,
      amount,
      currency,
      caseId,
      disputeUrl,
      dueDate,
      customerInfo,
    }),
    text: chargebackAlertEmailText({
      userName,
      amount,
      currency,
      caseId,
      disputeUrl,
      dueDate,
      customerInfo,
    }),
    payload: {
      userName,
      amount,
      currency,
      caseId,
      disputeUrl,
      dueDate,
      customerInfo,
    },
  });
}

export async function sendExportReadyEmail({
  to,
  userName,
  exportType,
  downloadUrl,
  expiresIn,
  recordCount,
  dateRange,
}: { to: string } & ExportReadyEmailProps): Promise<ResendSendData> {
  ensureNonEmpty(userName, 'userName');
  ensureNonEmpty(exportType, 'exportType');
  ensureNonEmpty(downloadUrl, 'downloadUrl');
  ensureNonEmpty(expiresIn, 'expiresIn');
  ensureFinite(recordCount, 'recordCount');
  ensureNonEmpty(dateRange, 'dateRange');

  return dispatchEmail({
    template: 'export-ready',
    to,
    subject: `Your ${exportType} Export is Ready - DeelRxCRM`,
    react: React.createElement(ExportReadyEmail, {
      userName,
      exportType,
      downloadUrl,
      expiresIn,
      recordCount,
      dateRange,
    }),
    text: exportReadyEmailText({
      userName,
      exportType,
      downloadUrl,
      expiresIn,
      recordCount,
      dateRange,
    }),
    payload: {
      userName,
      exportType,
      downloadUrl,
      expiresIn,
      recordCount,
      dateRange,
    },
  });
}

export async function sendBulkEmails(requests: SendEmailOptions[]): Promise<{
  successful: number;
  failed: number;
  results: PromiseSettledResult<ResendSendData>[];
}> {
  const results = await Promise.allSettled(
    requests.map((payload) => dispatchEmail(payload))
  );

  const successful = results.filter((result) => result.status === 'fulfilled')
    .length;
  const failed = results.length - successful;

  return { successful, failed, results };
}

export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export const emails = {
  sendWelcome: sendWelcomeEmail,
  sendPasswordReset: sendPasswordResetEmail,
  sendPayoutConfirmation: sendPayoutConfirmationEmail,
  sendChargebackAlert: sendChargebackAlertEmail,
  sendExportReady: sendExportReadyEmail,
  sendBulk: sendBulkEmails,
};

export default emails;
