import { Resend } from 'resend';
import React from 'react';

// Import email templates
import {
  WelcomeEmail,
  welcomeEmailText,
} from '../../emails/templates/WelcomeEmail';
import {
  PasswordResetEmail,
  passwordResetEmailText,
} from '../../emails/templates/PasswordResetEmail';
import {
  PayoutConfirmationEmail,
  payoutConfirmationEmailText,
} from '../../emails/templates/PayoutConfirmationEmail';
import {
  ChargebackAlertEmail,
  chargebackAlertEmailText,
} from '../../emails/templates/ChargebackAlertEmail';
import {
  ExportReadyEmail,
  exportReadyEmailText,
} from '../../emails/templates/ExportReadyEmail';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Base email configuration
const FROM_ADDRESS = 'DeelRxCRM <no-reply@deelrxcrm.app>';
const REPLY_TO = 'support@deelrxcrm.app';

// Email sending interface
interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  text: string;
  replyTo?: string;
}

// Generic email sender
const sendEmail = async (options: SendEmailOptions) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      react: options.react,
      text: options.text,
      reply_to: options.replyTo || REPLY_TO,
    });

    if (error) {
      console.error('Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Welcome/Verify Email
export const sendWelcomeEmail = async (
  to: string,
  userName: string,
  verifyUrl: string
) => {
  return sendEmail({
    to,
    subject: 'Welcome to DeelRxCRM – Verify Your Email',
    react: React.createElement(WelcomeEmail, { userName, verifyUrl }),
    text: welcomeEmailText(userName, verifyUrl),
  });
};

// Password Reset Email
export const sendPasswordResetEmail = async (
  to: string,
  userName: string,
  resetUrl: string,
  expiresIn: string = '24 hours'
) => {
  return sendEmail({
    to,
    subject: 'DeelRxCRM Password Reset Request',
    react: React.createElement(PasswordResetEmail, {
      userName,
      resetUrl,
      expiresIn,
    }),
    text: passwordResetEmailText(userName, resetUrl, expiresIn),
  });
};

// Payout Confirmation Email
export const sendPayoutConfirmationEmail = async (
  to: string,
  userName: string,
  amount: string,
  currency: string = 'USD',
  paymentMethod: string,
  expectedDate: string,
  transactionId: string
) => {
  return sendEmail({
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
    text: payoutConfirmationEmailText(
      userName,
      amount,
      currency,
      paymentMethod,
      expectedDate,
      transactionId
    ),
  });
};

// Chargeback Alert Email
export const sendChargebackAlertEmail = async (
  to: string,
  userName: string,
  amount: string,
  currency: string = 'USD',
  caseId: string,
  disputeUrl: string,
  dueDate: string,
  customerInfo: string
) => {
  return sendEmail({
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
    text: chargebackAlertEmailText(
      userName,
      amount,
      currency,
      caseId,
      disputeUrl,
      dueDate,
      customerInfo
    ),
  });
};

// Export Ready Email
export const sendExportReadyEmail = async (
  to: string,
  userName: string,
  exportType: string,
  downloadUrl: string,
  expiresIn: string = '7 days',
  recordCount: number,
  dateRange: string
) => {
  return sendEmail({
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
    text: exportReadyEmailText(
      userName,
      exportType,
      downloadUrl,
      expiresIn,
      recordCount,
      dateRange
    ),
  });
};

// Bulk email sender for notifications
export const sendBulkEmails = async (emails: SendEmailOptions[]) => {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Bulk email results: ${successful} sent, ${failed} failed`);

  return {
    successful,
    failed,
    results,
  };
};

// Email verification helper
export const isValidEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Environment check
export const isEmailConfigured = (): boolean => {
  return !!process.env.RESEND_API_KEY;
};

// Export all email functions as a convenient object
export const emails = {
  sendWelcome: sendWelcomeEmail,
  sendPasswordReset: sendPasswordResetEmail,
  sendPayoutConfirmation: sendPayoutConfirmationEmail,
  sendChargebackAlert: sendChargebackAlertEmail,
  sendExportReady: sendExportReadyEmail,
  sendBulk: sendBulkEmails,
};

export default emails;
