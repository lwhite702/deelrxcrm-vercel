import type { ChargebackAlertEmailProps } from './ChargebackAlertEmail';

export function chargebackAlertEmailText({
  userName,
  amount,
  currency,
  caseId,
  disputeUrl,
  dueDate,
  customerInfo,
}: ChargebackAlertEmailProps): string {
  return `
DEELRXCRM - CHARGEBACK ALERT - ACTION REQUIRED

🚨 Chargeback Alert - Action Required

Hey ${userName},

We got a situation. A customer just hit us with a chargeback. Time to lawyer up (with paperwork) and protect your money.

CHARGEBACK DETAILS:
Disputed Amount: ${currency} ${amount}
Case ID: ${caseId}
Customer: ${customerInfo}
Response Due: ${dueDate}

URGENT: You have until ${dueDate} to respond with evidence. Miss this deadline and you automatically lose the dispute.

HANDLE DISPUTE:
${disputeUrl}

WHAT YOU NEED:
• Customer communication records
• Proof of delivery/service completion
• Transaction receipts and invoices
• Any relevant screenshots or documentation

Don't sleep on this. Chargebacks are part of the game, but we fight every single one. Upload your evidence and let's get your money back where it belongs.

We're in your corner. Let's handle this business. 💪

— The DeelRxCRM Disputes Team

---
Need help? Contact us at support@deelrxcrm.app

© 2025 DeelRxCRM. For lawful business use only. Users must comply with applicable laws.
`.trim();
}
