import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 'test-resend-key';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';

const emailModulePromise = import('../lib/email/send');

test('sendWelcomeEmail throws when userName is empty', async () => {
  const { sendWelcomeEmail } = await emailModulePromise;

  await assert.rejects(
    sendWelcomeEmail({
      to: 'ops@example.com',
      userName: '   ',
      verifyUrl: 'https://deelrxcrm.app/verify',
    }),
    /userName is required/i
  );
});

test('sendPasswordResetEmail rejects when recipient is missing', async () => {
  const { sendPasswordResetEmail } = await emailModulePromise;

  await assert.rejects(
    sendPasswordResetEmail({
      to: ' ',
      userName: 'Ops Admin',
      resetUrl: 'https://deelrxcrm.app/reset',
      expiresIn: '24 hours',
    }),
    /Recipient email is required/i
  );
});

test('sendExportReadyEmail validates recordCount', async () => {
  const { sendExportReadyEmail } = await emailModulePromise;

  await assert.rejects(
    sendExportReadyEmail({
      to: 'finance@example.com',
      userName: 'Finance Ops',
      exportType: 'Compliance Export',
      downloadUrl: 'https://deelrxcrm.app/exports/123',
      expiresIn: '3 days',
      recordCount: Number.NaN,
      dateRange: 'Jan 01 – Feb 19',
    }),
    /recordCount must be a finite number/i
  );
});
