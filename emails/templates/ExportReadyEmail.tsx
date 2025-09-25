import React from 'react';
import {
  baseStyles,
  brandColors,
  EmailHeader,
  EmailFooter,
} from './BaseComponents';

export interface ExportReadyEmailProps {
  userName: string;
  exportType: string;
  downloadUrl: string;
  expiresIn: string;
  recordCount: number;
  dateRange: string;
}

export const ExportReadyEmail: React.FC<ExportReadyEmailProps> = ({
  userName,
  exportType,
  downloadUrl,
  expiresIn,
  recordCount,
  dateRange,
}) => (
  <div style={baseStyles.body}>
    <div style={baseStyles.container}>
      <EmailHeader />

      <div style={baseStyles.content}>
        <h1
          style={{
            color: brandColors.neonCyan,
            fontSize: '28px',
            marginBottom: '20px',
          }}
        >
          Your Export is Ready! 📊
        </h1>

        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Hey {userName},
        </p>

        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
          Your data export just finished cooking. We've packaged up all your
          business intel and it's ready for download. Time to analyze that paper
          trail! 📈
        </p>

        <div
          style={{
            backgroundColor: brandColors.darkGray,
            padding: '25px',
            borderRadius: '8px',
            border: `2px solid ${brandColors.neonCyan}`,
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: brandColors.neonCyan,
              textAlign: 'center',
              marginBottom: '15px',
            }}
          >
            {exportType} Export
          </div>

          <div style={{ fontSize: '14px', color: brandColors.gray }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: brandColors.foreground }}>
                Records:
              </strong>{' '}
              {recordCount.toLocaleString()} items
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: brandColors.foreground }}>
                Date Range:
              </strong>{' '}
              {dateRange}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: brandColors.foreground }}>
                Download Expires:
              </strong>{' '}
              {expiresIn}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a
            href={downloadUrl}
            style={{
              ...baseStyles.button,
              backgroundColor: brandColors.neonCyan,
            }}
          >
            Download My Export
          </a>
        </div>

        <div
          style={{
            backgroundColor: '#1F2937',
            padding: '15px',
            borderRadius: '4px',
            borderLeft: `4px solid ${brandColors.neonLime}`,
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: brandColors.neonLime }}>Pro Move:</strong>{' '}
          Import this data into your accounting software or spreadsheet to
          analyze trends, track performance, and spot opportunities.
        </div>

        <div
          style={{
            backgroundColor: brandColors.darkGray,
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: brandColors.neonRed }}>
            Security Notice:
          </strong>
          <ul
            style={{
              margin: '10px 0',
              paddingLeft: '20px',
              color: brandColors.gray,
              fontSize: '14px',
            }}
          >
            <li>This download link expires in {expiresIn}</li>
            <li>Keep your exported data secure and encrypted</li>
            <li>Don't share sensitive business data</li>
            <li>Delete old exports when you're done with them</li>
          </ul>
        </div>

        <p style={{ fontSize: '14px', color: brandColors.gray }}>
          Can't click the button? Copy and paste this link:
          <br />
          <span style={{ color: brandColors.neonCyan, wordBreak: 'break-all' }}>
            {downloadUrl}
          </span>
        </p>

        <p style={{ fontSize: '16px', marginTop: '30px' }}>
          Need another export? Just hit up the dashboard and generate a new one
          anytime. Knowledge is power, and power moves the money. 💰
        </p>

        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <a
            href="https://deelrxcrm.app/dashboard/exports"
            style={baseStyles.buttonSecondary}
          >
            Export More Data
          </a>
        </div>

        <p
          style={{
            fontSize: '14px',
            color: brandColors.gray,
            fontStyle: 'italic',
          }}
        >
          — The DeelRxCRM Data Team
        </p>
      </div>

      <EmailFooter />
    </div>
  </div>
);

export default ExportReadyEmail;
