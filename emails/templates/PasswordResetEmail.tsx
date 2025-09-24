import React from 'react';
import {
  baseStyles,
  brandColors,
  EmailHeader,
  EmailFooter,
} from './BaseComponents';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresIn: string; // e.g., "24 hours"
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName,
  resetUrl,
  expiresIn,
}) => (
  <div style={baseStyles.body}>
    <div style={baseStyles.container}>
      <EmailHeader />

      <div style={baseStyles.content}>
        <h1
          style={{
            color: brandColors.neonRed,
            fontSize: '28px',
            marginBottom: '20px',
          }}
        >
          Reset Your Password 🔐
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hey {userName},
        </p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Someone requested a password reset for your DeelRxCRM account. If this
          was you, click the button below to create a new password. If it wasn't
          you, just ignore this email - your account stays locked down tight.
        </p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={resetUrl}
            style={{
              ...baseStyles.button,
              backgroundColor: brandColors.neonRed,
            }}
          >
            Reset My Password
          </a>
        </div>

        <div
          style={{
            backgroundColor: brandColors.darkGray,
            padding: '15px',
            borderRadius: '4px',
            borderLeft: `4px solid ${brandColors.neonRed}`,
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: brandColors.neonRed }}>
            Security Notice:
          </strong>{' '}
          This reset link expires in {expiresIn}. After that, you'll need to
          request a new one.
        </div>

        <p style={{ fontSize: '14px', color: brandColors.gray }}>
          Can't click the button? Copy and paste this link into your browser:
          <br />
          <span style={{ color: brandColors.neonCyan, wordBreak: 'break-all' }}>
            {resetUrl}
          </span>
        </p>

        <div
          style={{
            backgroundColor: '#1F2937',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '30px',
            fontSize: '14px',
          }}
        >
          <strong style={{ color: brandColors.neonCyan }}>
            Security Tips:
          </strong>
          <ul
            style={{
              margin: '10px 0',
              paddingLeft: '20px',
              color: brandColors.gray,
            }}
          >
            <li>Choose a strong, unique password</li>
            <li>Don't reuse passwords from other sites</li>
            <li>Keep your business data secure</li>
          </ul>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: brandColors.gray,
            fontStyle: 'italic',
            marginTop: '20px',
          }}
        >
          — The DeelRxCRM Security Team
        </p>
      </div>

      <EmailFooter />
    </div>
  </div>
);

// Plaintext fallback
export const passwordResetEmailText = (
  userName: string,
  resetUrl: string,
  expiresIn: string
): string =>
  `
DEELRXCRM - RESET YOUR PASSWORD

Reset Your Password 🔐

Hey ${userName},

Someone requested a password reset for your DeelRxCRM account. If this was you, click the link below to create a new password. If it wasn't you, just ignore this email - your account stays locked down tight.

RESET YOUR PASSWORD:
${resetUrl}

SECURITY NOTICE: This reset link expires in ${expiresIn}. After that, you'll need to request a new one.

SECURITY TIPS:
• Choose a strong, unique password
• Don't reuse passwords from other sites  
• Keep your business data secure

— The DeelRxCRM Security Team

---
Need help? Contact us at support@deelrxcrm.app

© 2025 DeelRxCRM. For lawful business use only. Users must comply with applicable laws.
`.trim();

export default PasswordResetEmail;
