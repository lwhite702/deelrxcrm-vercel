import { Resend } from "resend";

let resend: Resend | null = null;

/**
 * Retrieves the Resend client instance, creating it if necessary.
 */
function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resend;
}

export interface EmailPayload {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Send credit due notification email as fallback.
 *
 * This function constructs and sends an email notification regarding a credit payment that is due or overdue.
 * It determines the urgency of the notification based on the number of days overdue and formats the email content accordingly.
 * The email is sent using a resend client, and the function handles any errors that may occur during the sending process.
 *
 * @param to - An array of recipient email addresses.
 * @param payload - An object containing details about the customer and payment.
 * @param payload.customerName - The name of the customer.
 * @param payload.amount - The amount due in cents.
 * @param payload.dueDate - The due date of the payment.
 * @param payload.daysOverdue - The number of days the payment is overdue.
 * @param payload.creditId - The identifier for the credit account.
 * @returns A promise that resolves to an object indicating the success of the email sending operation,
 *          the provider used, and optionally the message ID or error message.
 */
export async function sendCreditDueEmail({
  to,
  payload,
}: {
  to: string[];
  payload: {
    customerName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    creditId: string;
  };
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const resendClient = getResendClient();
    const urgencyClass = payload.daysOverdue > 60 ? "urgent" : payload.daysOverdue > 30 ? "high" : "normal";
    const urgencyColor = urgencyClass === "urgent" ? "#dc2626" : urgencyClass === "high" ? "#ea580c" : "#2563eb";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Credit Payment Due</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .amount { font-size: 24px; font-weight: bold; color: ${urgencyColor}; }
            .button { background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Credit Payment ${payload.daysOverdue > 0 ? 'Overdue' : 'Due'}</h1>
            </div>
            <div class="content">
              <p>Hello ${payload.customerName},</p>
              
              ${payload.daysOverdue > 0 ? `
                <div class="alert">
                  <strong>⚠️ Payment Overdue</strong><br>
                  This payment is <strong>${payload.daysOverdue} days overdue</strong>.
                </div>
              ` : ''}
              
              <p>We're reaching out regarding your credit account payment:</p>
              
              <ul>
                <li><strong>Amount Due:</strong> <span class="amount">$${(payload.amount / 100).toFixed(2)}</span></li>
                <li><strong>Due Date:</strong> ${new Date(payload.dueDate).toLocaleDateString()}</li>
                <li><strong>Credit ID:</strong> ${payload.creditId}</li>
              </ul>
              
              <p>Please make your payment as soon as possible to avoid additional fees and maintain your credit standing.</p>
              
              <a href="#" class="button">Make Payment</a>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Thank you,<br>DeelRx CRM Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Credit Payment ${payload.daysOverdue > 0 ? 'Overdue' : 'Due'}

Hello ${payload.customerName},

${payload.daysOverdue > 0 ? `⚠️ This payment is ${payload.daysOverdue} days overdue.` : ''}

Payment Details:
- Amount Due: $${(payload.amount / 100).toFixed(2)}
- Due Date: ${new Date(payload.dueDate).toLocaleDateString()}
- Credit ID: ${payload.creditId}

Please make your payment as soon as possible to avoid additional fees.

Thank you,
DeelRx CRM Team
    `;

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@deelrxcrm.app",
      to,
      subject: `Credit Payment ${payload.daysOverdue > 0 ? 'Overdue' : 'Due'} - $${(payload.amount / 100).toFixed(2)}`,
      html,
      text,
    });

    return {
      success: true,
      provider: "resend",
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Resend email failed:", error);
    return {
      success: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a notification email for a new KB article.
 *
 * This function constructs an HTML email using the provided article details and sends it to the specified recipients using the Resend client. It handles both successful and failed email sending attempts, returning an object that indicates the success status, the email provider, and optionally the message ID or error message.
 *
 * @param {Object} params - The parameters for sending the email.
 * @param {string[]} params.to - The list of recipient email addresses.
 * @param {Object} params.payload - The details of the article.
 * @param {string} params.payload.articleTitle - The title of the article.
 * @param {string} params.payload.articleId - The ID of the article.
 * @param {string} params.payload.authorName - The name of the article's author.
 * @param {string} params.payload.teamName - The name of the team associated with the article.
 */
export async function sendKBArticleEmail({
  to,
  payload,
}: {
  to: string[];
  payload: {
    articleTitle: string;
    articleId: string;
    authorName: string;
    teamName: string;
  };
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const resendClient = getResendClient();
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Knowledge Base Article</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 New Knowledge Base Article</h1>
            </div>
            <div class="content">
              <p>A new article has been published in the ${payload.teamName} knowledge base:</p>
              
              <h2>${payload.articleTitle}</h2>
              
              <p><strong>Author:</strong> ${payload.authorName}</p>
              
              <a href="#" class="button">Read Article</a>
              
              <p>Stay informed with the latest updates and resources from your team.</p>
              
              <p>Best regards,<br>DeelRx CRM Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@deelrxcrm.app",
      to,
      subject: `New Article: ${payload.articleTitle}`,
      html,
    });

    return {
      success: true,
      provider: "resend",
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Resend KB email failed:", error);
    return {
      success: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send an admin alert email as a fallback mechanism.
 *
 * This function constructs an HTML email based on the provided alert details, including severity and message. It utilizes a resend client to send the email to the specified recipients. The email's appearance is customized based on the severity level, and it includes optional details if provided. In case of an error during the sending process, it logs the error and returns a failure response.
 *
 * @param to - An array of recipient email addresses.
 * @param payload - An object containing the alert details.
 * @param payload.alertType - The type of alert being sent.
 * @param payload.severity - The severity level of the alert, which can be "low", "medium", "high", or "critical".
 * @param payload.message - The main message of the alert.
 * @param payload.details - Optional additional details related to the alert.
 * @returns A promise that resolves to an object indicating the success of the email sending operation, the provider used, and optionally the message ID or error message.
 */
export async function sendAdminAlertEmail({
  to,
  payload,
}: {
  to: string[];
  payload: {
    alertType: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    details?: Record<string, any>;
  };
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const resendClient = getResendClient();
    const severityColors = {
      low: "#10b981",
      medium: "#f59e0b",
      high: "#ea580c",
      critical: "#dc2626",
    };

    const severityIcons = {
      low: "ℹ️",
      medium: "⚠️",
      high: "🔥",
      critical: "🚨",
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Admin Alert</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColors[payload.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .severity { text-transform: uppercase; font-weight: bold; color: ${severityColors[payload.severity]}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${severityIcons[payload.severity]} Admin Alert</h1>
            </div>
            <div class="content">
              <p><strong>Alert Type:</strong> ${payload.alertType}</p>
              <p><strong>Severity:</strong> <span class="severity">${payload.severity}</span></p>
              
              <div class="details">
                <h3>Message</h3>
                <p>${payload.message}</p>
                
                ${payload.details && Object.keys(payload.details).length > 0 ? `
                  <h3>Details</h3>
                  <pre>${JSON.stringify(payload.details, null, 2)}</pre>
                ` : ''}
              </div>
              
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              
              <p>Please investigate and take appropriate action if necessary.</p>
              
              <p>DeelRx CRM System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resendClient.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "alerts@deelrxcrm.app",
      to,
      subject: `[${payload.severity.toUpperCase()}] ${payload.alertType}: ${payload.message}`,
      html,
    });

    return {
      success: true,
      provider: "resend",
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Resend admin alert failed:", error);
    return {
      success: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends an email using the Resend service.
 *
 * This function constructs an email using the provided payload and attempts to send it via the Resend client.
 * It handles both successful and failed email sending attempts, returning an object that indicates the success status,
 * the provider used, and optionally the message ID or error message if the sending fails.
 *
 * @param {EmailPayload} payload - The email details including sender, recipient, subject, and content.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const resendClient = getResendClient();
    const result = await resendClient.emails.send({
      from: payload.from || process.env.RESEND_FROM_EMAIL || "noreply@deelrxcrm.app",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return {
      success: true,
      provider: "resend",
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("Resend generic email failed:", error);
    return {
      success: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}