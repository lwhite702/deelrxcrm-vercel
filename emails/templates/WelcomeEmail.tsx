import React from 'react';
import {
  baseStyles,
  brandColors,
  EmailHeader,
  EmailFooter,
} from './BaseComponents';

export interface WelcomeEmailProps {
  userName: string;
  verifyUrl: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  verifyUrl,
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
          Welcome to the Block, {userName}! 👑
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          You've just joined the most street-smart CRM in the game. We're about
          to revolutionize how you manage your business, track your customers,
          and secure your profits.
        </p>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          But first, we need to verify you're the real deal. Click the button
          below to confirm your email and unlock your full DeelRxCRM potential:
        </p>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href={verifyUrl} style={baseStyles.button}>
            Verify My Email & Get Started
          </a>
        </div>

        <div
          style={{
            backgroundColor: brandColors.darkGray,
            padding: '15px',
            borderRadius: '4px',
            borderLeft: `4px solid ${brandColors.neonCyan}`,
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: brandColors.neonCyan }}>
            Privacy First:
          </strong>{' '}
          Your data stays locked down tight. We don't sell, share, or leak your
          business intel. Period.
        </div>

        <p style={{ fontSize: '14px', color: brandColors.gray }}>
          Can't click the button? Copy and paste this link into your browser:
          <br />
          <span style={{ color: brandColors.neonCyan, wordBreak: 'break-all' }}>
            {verifyUrl}
          </span>
        </p>

        <p style={{ fontSize: '16px', marginTop: '30px' }}>
          Ready to run your business like a boss?
          <br />
          Let's get this money. 💰
        </p>

        <p
          style={{
            fontSize: '14px',
            color: brandColors.gray,
            fontStyle: 'italic',
          }}
        >
          — The DeelRxCRM Team
        </p>
      </div>

      <EmailFooter />
    </div>
  </div>
);

export default WelcomeEmail;
