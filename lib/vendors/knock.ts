import { Knock } from "@knocklabs/node";

let knock: Knock | null = null;

function getKnockClient(): Knock {
  if (!process.env.KNOCK_API_KEY) {
    throw new Error("KNOCK_API_KEY environment variable is required");
  }
  
  if (!knock) {
    knock = new Knock(process.env.KNOCK_API_KEY);
  }
  
  return knock;
}

export interface NotificationPayload {
  userId: string;
  email: string;
  data: Record<string, any>;
}

/**
 * Send credit due notification via Knock workflow
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
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const knockClient = getKnockClient();
    const result = await knockClient.workflows.trigger("credit_due", {
      recipients: [
        {
          id: userId,
          email,
        },
      ],
      data: {
        customer_name: payload.customerName,
        amount_formatted: `$${(payload.amount / 100).toFixed(2)}`,
        amount_cents: payload.amount,
        due_date: payload.dueDate,
        days_overdue: payload.daysOverdue,
        credit_id: payload.creditId,
        urgency_level: payload.daysOverdue > 60 ? "urgent" : payload.daysOverdue > 30 ? "high" : "normal",
      },
    });

    return {
      success: true,
      provider: "knock",
      messageId: result.workflow_run_id,
    };
  } catch (error) {
    console.error("Knock notification failed:", error);
    return {
      success: false,
      provider: "knock",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send KB article published notification
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
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const knockClient = getKnockClient();
    const result = await knockClient.workflows.trigger("kb_article_published", {
      recipients: [
        {
          id: userId,
          email,
        },
      ],
      data: {
        article_title: payload.articleTitle,
        article_id: payload.articleId,
        author_name: payload.authorName,
        team_name: payload.teamName,
      },
    });

    return {
      success: true,
      provider: "knock",
      messageId: result.workflow_run_id,
    };
  } catch (error) {
    console.error("Knock KB notification failed:", error);
    return {
      success: false,
      provider: "knock",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin alert notification
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
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const knockClient = getKnockClient();
    const result = await knockClient.workflows.trigger("admin_alert", {
      recipients: [
        {
          id: userId,
          email,
        },
      ],
      data: {
        alert_type: payload.alertType,
        severity: payload.severity,
        message: payload.message,
        details: payload.details || {},
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      provider: "knock",
      messageId: result.workflow_run_id,
    };
  } catch (error) {
    console.error("Knock admin alert failed:", error);
    return {
      success: false,
      provider: "knock",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send batch notifications to multiple users
 */
export async function notifyBatch({
  workflowId,
  recipients,
  data,
}: {
  workflowId: string;
  recipients: Array<{ userId: string; email: string }>;
  data: Record<string, any>;
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  try {
    const knockClient = getKnockClient();
    const result = await knockClient.workflows.trigger(workflowId, {
      recipients: recipients.map((r) => ({
        id: r.userId,
        email: r.email,
      })),
      data,
    });

    return {
      success: true,
      provider: "knock",
      messageId: result.workflow_run_id,
    };
  } catch (error) {
    console.error("Knock batch notification failed:", error);
    return {
      success: false,
      provider: "knock",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}