import { notifyCreditDue as knockCreditDue, notifyKBArticlePublished as knockKBArticle, notifyAdminAlert as knockAdminAlert } from "./vendors/knock";
import { sendCreditDueEmail, sendKBArticleEmail, sendAdminAlertEmail } from "./vendors/resend";

export interface NotificationResult {
  success: boolean;
  primaryProvider: string;
  fallbackUsed: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send credit due notification with Knock primary, Resend fallback
 */
export async function notifyCreditDue({
  userId,
  email,
  payload,
}: {
  userId: string;
  email: string;
  payload: {
    customerName: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    creditId: string;
  };
}): Promise<NotificationResult> {
  // Try Knock first
  try {
    const knockResult = await knockCreditDue({ userId, email, payload });
    if (knockResult.success) {
      return {
        success: true,
        primaryProvider: "knock",
        fallbackUsed: false,
        messageId: knockResult.messageId,
      };
    }
    
    console.warn("Knock notification failed, falling back to Resend:", knockResult.error);
  } catch (error) {
    console.warn("Knock notification error, falling back to Resend:", error);
  }

  // Fallback to Resend
  try {
    const resendResult = await sendCreditDueEmail({
      to: [email],
      payload,
    });

    return {
      success: resendResult.success,
      primaryProvider: "knock",
      fallbackUsed: true,
      messageId: resendResult.messageId,
      error: resendResult.error,
    };
  } catch (error) {
    return {
      success: false,
      primaryProvider: "knock",
      fallbackUsed: true,
      error: error instanceof Error ? error.message : "Both providers failed",
    };
  }
}

/**
 * Send KB article notification with Knock primary, Resend fallback
 */
export async function notifyKBArticlePublished({
  userId,
  email,
  payload,
}: {
  userId: string;
  email: string;
  payload: {
    articleTitle: string;
    articleId: string;
    authorName: string;
    teamName: string;
  };
}): Promise<NotificationResult> {
  // Try Knock first
  try {
    const knockResult = await knockKBArticle({ userId, email, payload });
    if (knockResult.success) {
      return {
        success: true,
        primaryProvider: "knock",
        fallbackUsed: false,
        messageId: knockResult.messageId,
      };
    }
    
    console.warn("Knock KB notification failed, falling back to Resend:", knockResult.error);
  } catch (error) {
    console.warn("Knock KB notification error, falling back to Resend:", error);
  }

  // Fallback to Resend
  try {
    const resendResult = await sendKBArticleEmail({
      to: [email],
      payload,
    });

    return {
      success: resendResult.success,
      primaryProvider: "knock",
      fallbackUsed: true,
      messageId: resendResult.messageId,
      error: resendResult.error,
    };
  } catch (error) {
    return {
      success: false,
      primaryProvider: "knock",
      fallbackUsed: true,
      error: error instanceof Error ? error.message : "Both providers failed",
    };
  }
}

/**
 * Send admin alert with Knock primary, Resend fallback
 */
export async function notifyAdminAlert({
  userId,
  email,
  payload,
}: {
  userId: string;
  email: string;
  payload: {
    alertType: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    details?: Record<string, any>;
  };
}): Promise<NotificationResult> {
  // Try Knock first
  try {
    const knockResult = await knockAdminAlert({ userId, email, payload });
    if (knockResult.success) {
      return {
        success: true,
        primaryProvider: "knock",
        fallbackUsed: false,
        messageId: knockResult.messageId,
      };
    }
    
    console.warn("Knock admin alert failed, falling back to Resend:", knockResult.error);
  } catch (error) {
    console.warn("Knock admin alert error, falling back to Resend:", error);
  }

  // Fallback to Resend
  try {
    const resendResult = await sendAdminAlertEmail({
      to: [email],
      payload,
    });

    return {
      success: resendResult.success,
      primaryProvider: "knock",
      fallbackUsed: true,
      messageId: resendResult.messageId,
      error: resendResult.error,
    };
  } catch (error) {
    return {
      success: false,
      primaryProvider: "knock",
      fallbackUsed: true,
      error: error instanceof Error ? error.message : "Both providers failed",
    };
  }
}