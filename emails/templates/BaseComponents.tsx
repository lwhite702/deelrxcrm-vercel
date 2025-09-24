import React from 'react';

// DeelRxCRM Brand Colors - Asphalt+Neon Palette
export const brandColors = {
  background: '#0B0F14',
  foreground: '#E5E7EB',
  neonLime: '#A3E635',
  neonCyan: '#22D3EE',
  neonRed: '#EF4444',
  gray: '#6B7280',
  darkGray: '#374151',
};

// Base email styles matching DeelRxCRM brand
export const baseStyles = {
  body: {
    backgroundColor: brandColors.background,
    color: brandColors.foreground,
    fontFamily: 'sans-serif',
    lineHeight: '1.6',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    borderBottom: `2px solid ${brandColors.neonCyan}`,
    paddingBottom: '20px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: brandColors.neonLime,
    marginBottom: '10px',
  },
  tagline: {
    fontSize: '14px',
    color: brandColors.gray,
    fontStyle: 'italic',
  },
  content: {
    marginBottom: '30px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: brandColors.neonLime,
    color: brandColors.background,
    padding: '12px 24px',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '16px',
    textAlign: 'center' as const,
    margin: '20px 0',
  },
  buttonSecondary: {
    display: 'inline-block',
    backgroundColor: 'transparent',
    color: brandColors.neonCyan,
    border: `2px solid ${brandColors.neonCyan}`,
    padding: '12px 24px',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '16px',
    textAlign: 'center' as const,
    margin: '20px 0',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: `1px solid ${brandColors.darkGray}`,
    fontSize: '12px',
    color: brandColors.gray,
    textAlign: 'center' as const,
  },
  disclaimer: {
    fontSize: '11px',
    color: brandColors.gray,
    fontStyle: 'italic',
    marginTop: '15px',
  },
};

// Reusable header component
export const EmailHeader: React.FC = () => (
  <div style={baseStyles.header}>
    <div style={baseStyles.logo}>DeelRxCRM</div>
    <div style={baseStyles.tagline}>Run the Block. Run the Business.</div>
  </div>
);

// Reusable footer component with legal disclaimer
export const EmailFooter: React.FC = () => (
  <div style={baseStyles.footer}>
    <div>
      Need help? Contact us at{' '}
      <a
        href="mailto:support@deelrxcrm.app"
        style={{ color: brandColors.neonCyan }}
      >
        support@deelrxcrm.app
      </a>
    </div>
    <div style={baseStyles.disclaimer}>
      © 2025 DeelRxCRM. For lawful business use only. Users must comply with
      applicable laws.
    </div>
  </div>
);
