import React from 'react';
import {
  baseStyles,
  brandColors,
  EmailHeader,
  EmailFooter,
} from './BaseComponents';

export interface PayoutConfirmationEmailProps {
  userName: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  expectedDate: string;
  transactionId: string;
}

export const PayoutConfirmationEmail: React.FC<
  PayoutConfirmationEmailProps
> = ({
  userName,
  amount,
  currency,
  paymentMethod,
  expectedDate,
  transactionId,
}) => (
  <div style={baseStyles.body}>
    <div style={baseStyles.container}>
      <EmailHeader />

      <div style={baseStyles.content}>
        <h1
          style={{
            color: brandColors.neonLime,
            fontSize: '28px',
            marginBottom: '20px',
          }}
        >
          Payout Confirmed! 💰
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hey {userName},
        </p>

        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
          Your payout is locked and loaded. Money's about to move - here's the
          breakdown:
        </p>

        <div
          style={{
            backgroundColor: brandColors.darkGray,
            padding: '25px',
            borderRadius: '8px',
            border: `2px solid ${brandColors.neonLime}`,
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: brandColors.neonLime,
              textAlign: 'center',
              marginBottom: '15px',
            }}
          >
            {currency} {amount}
          </div>

          <div style={{ fontSize: '14px', color: brandColors.gray }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: brandColors.foreground }}>
                Payment Method:
              </strong>{' '}
              {paymentMethod}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: brandColors.foreground }}>
                Expected Date:
              </strong>{' '}
              {expectedDate}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: brandColors.foreground }}>
                Transaction ID:
              </strong>{' '}
              {transactionId}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          We'll hit you up once the funds land in your account. In the meantime,
          keep grinding and stacking that paper. 📈
        </p>

        <div
          style={{
            backgroundColor: '#1F2937',
            padding: '15px',
            borderRadius: '4px',
            borderLeft: `4px solid ${brandColors.neonCyan}`,
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: brandColors.neonCyan }}>Pro Tip:</strong> Keep
          this email for your records. Your accountant will thank you later.
        </div>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href="https://deelrxcrm.app/dashboard/payments"
            style={baseStyles.buttonSecondary}
          >
            View Payment History
          </a>
        </div>

        <p style={{ fontSize: '16px', marginTop: '30px' }}>
          Questions about your payout? We got you covered.
          <br />
          Keep securing that bag! 💪
        </p>

        <p
          style={{
            fontSize: '14px',
            color: brandColors.gray,
            fontStyle: 'italic',
          }}
        >
          — The DeelRxCRM Payments Team
        </p>
      </div>

      <EmailFooter />
    </div>
  </div>
);

export default PayoutConfirmationEmail;
