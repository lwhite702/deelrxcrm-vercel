import type { ExportReadyEmailProps } from './ExportReadyEmail';

export function exportReadyEmailText({
  userName,
  exportType,
  downloadUrl,
  expiresIn,
  recordCount,
  dateRange,
}: ExportReadyEmailProps): string {
  return `
DEELRXCRM - YOUR EXPORT IS READY!

Your Export is Ready! 📊

Hey ${userName},

Your data export just finished cooking. We've packaged up all your business intel and it's ready for download. Time to analyze that paper trail! 📈

EXPORT DETAILS:
Type: ${exportType} Export
Records: ${recordCount.toLocaleString()} items
Date Range: ${dateRange}
Download Expires: ${expiresIn}

DOWNLOAD YOUR EXPORT:
${downloadUrl}

PRO MOVE: Import this data into your accounting software or spreadsheet to analyze trends, track performance, and spot opportunities.

SECURITY NOTICE:
• This download link expires in ${expiresIn}
• Keep your exported data secure and encrypted
• Don't share sensitive business data
• Delete old exports when you're done with them

Need another export? Just hit up the dashboard and generate a new one anytime. Knowledge is power, and power moves the money. 💰

Export more data: https://deelrxcrm.app/dashboard/exports

— The DeelRxCRM Data Team

---
Need help? Contact us at support@deelrxcrm.app

© 2025 DeelRxCRM. For lawful business use only. Users must comply with applicable laws.
`.trim();
}
