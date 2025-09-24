import React from 'react';
import {
  baseStyles,
  brandColors,
  EmailHeader,
  EmailFooter,
} from './BaseComponents';

interface ChargebackAlertEmailProps {
  userName: string;
  amount: string;
  currency: string;
  caseId: string;
  disputeUrl: string;
  dueDate: string;
  customerInfo: string;
}

export const ChargebackAlertEmail: React.FC<ChargebackAlertEmailProps> = ({
  userName,
  amount,
  currency,
  caseId,
  disputeUrl,
  dueDate,
  customerInfo,
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
          🚨 Chargeback Alert - Action Required
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hey {userName},
        </p>

        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
          We got a situation. A customer just hit us with a chargeback. Time to
          lawyer up (with paperwork) and protect your money.
        </p>

        <div
          style={{
            backgroundColor: '#7F1D1D',
            padding: '25px',
            borderRadius: '8px',
            border: `2px solid ${brandColors.neonRed}`,
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: brandColors.neonRed,
              textAlign: 'center',
              marginBottom: '15px',
            }}
          >
            DISPUTED: {currency} {amount}
          </div>

          <div style={{ fontSize: '14px', color: brandColors.foreground }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Case ID:</strong> {caseId}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Customer:</strong> {customerInfo}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Response Due:</strong> {dueDate}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: brandColors.darkGray,
            padding: '15px',
            borderRadius: '4px',
            borderLeft: `4px solid ${brandColors.neonRed}`,
            marginBottom: '30px',
          }}
        >
          <strong style={{ color: brandColors.neonRed }}>URGENT:</strong> You
          have until {dueDate} to respond with evidence. Miss this deadline and
          you automatically lose the dispute.
        </div>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={disputeUrl}
            style={{
              ...baseStyles.button,
              backgroundColor: brandColors.neonRed,
            }}
          >
            Handle Dispute Now
          </a>
        </div>

        <div
          style={{
            backgroundColor: '#1F2937',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: brandColors.neonCyan }}>
            What You Need:
          </strong>
          <ul
            style={{
              margin: '10px 0',
              paddingLeft: '20px',
              color: brandColors.gray,
              fontSize: '14px',
            }}
          >
            <li>Customer communication records</li>
            <li>Proof of delivery/service completion</li>
            <li>Transaction receipts and invoices</li>
            <li>Any relevant screenshots or documentation</li>
          </ul>
        </div>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Don't sleep on this. Chargebacks are part of the game, but we fight
          every single one. Upload your evidence and let's get your money back
          where it belongs.
        </p>

        <p style={{ fontSize: '14px', color: brandColors.gray }}>
          Can't click the button? Copy and paste this link:
          <br />
          <span style={{ color: brandColors.neonCyan, wordBreak: 'break-all' }}>
            {disputeUrl}
          </span>
        </p>

        <p style={{ fontSize: '16px', marginTop: '30px' }}>
          We're in your corner. Let's handle this business. 💪
        </p>

        <p
          style={{
            fontSize: '14px',
            color: brandColors.gray,
            fontStyle: 'italic',
          }}
        >
          — The DeelRxCRM Disputes Team
        </p>
      </div>

      <EmailFooter />
    </div>
  </div>
);

// Plaintext fallback
export const chargebackAlertEmailText = (
  userName: string,
  amount: string,
  currency: string,
  caseId: string,
  disputeUrl: string,
  dueDate: string,
  customerInfo: string
): string =>
  `
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

export default ChargebackAlertEmail;
