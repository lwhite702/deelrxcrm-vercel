import type { PayoutConfirmationEmailProps } from './PayoutConfirmationEmail';

export function payoutConfirmationEmailText({
  userName,
  amount,
  currency,
  paymentMethod,
  expectedDate,
  transactionId,
}: PayoutConfirmationEmailProps): string {
  return `
DEELRXCRM - PAYOUT CONFIRMED!

Payout Confirmed! 💰

Hey ${userName},

Your payout is locked and loaded. Money's about to move - here's the breakdown:

PAYOUT DETAILS:
Amount: ${currency} ${amount}
Payment Method: ${paymentMethod}
Expected Date: ${expectedDate}
Transaction ID: ${transactionId}

We'll hit you up once the funds land in your account. In the meantime, keep grinding and stacking that paper. 📈

PRO TIP: Keep this email for your records. Your accountant will thank you later.

View your payment history: https://deelrxcrm.app/dashboard/payments

Questions about your payout? We got you covered.
Keep securing that bag! 💪

— The DeelRxCRM Payments Team

---
Need help? Contact us at support@deelrxcrm.app

© 2025 DeelRxCRM. For lawful business use only. Users must comply with applicable laws.
`.trim();
}
