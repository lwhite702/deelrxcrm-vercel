import type { PasswordResetEmailProps } from './PasswordResetEmail';

export function passwordResetEmailText({
  userName,
  resetUrl,
  expiresIn,
}: PasswordResetEmailProps): string {
  return `
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
}
