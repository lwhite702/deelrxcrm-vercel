import { Knock } from "@knocklabs/node";

export interface KnockResult {
  success: boolean;
  provider: "knock";
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

export const KnockTopics = {
  ACCOUNT_EVENTS: "account_events",
  BILLING_NOTICES: "billing_notices",
  EXPORT_READY: "export_ready",
  CREDIT_NOTICES: "credit_due",
  KNOWLEDGE_BASE: "kb_article_published",
  ADMIN_ALERTS: "admin_alert",
} as const;

let knockClient: Knock | null = null;
let warned = false;

function getKnock(): Knock | null {
  if (!process.env.KNOCK_API_KEY) {
    if (!warned) {
      console.info("Knock disabled - KNOCK_API_KEY not configured");
      warned = true;
    }
    return null;
  }

  if (!knockClient) {
    knockClient = new Knock(process.env.KNOCK_API_KEY);
  }

  return knockClient;
}

function skippedResult(workflow: string): KnockResult {
  return {
    success: false,
    provider: "knock",
    skipped: true,
    error: `${workflow} skipped; Knock not configured`,
  };
}

function errorResult(workflow: string, error: unknown): KnockResult {
  console.error(`Knock ${workflow} notification failed:`, error);
  return {
    success: false,
    provider: "knock",
    error: error instanceof Error ? error.message : "Unknown error",
  };
}

async function triggerWorkflow(
  workflow: string,
  payload: Record<string, any>
): Promise<KnockResult> {
  const client = getKnock();
  if (!client) {
    return skippedResult(workflow);
  }

  try {
    const result = await client.workflows.trigger(workflow, payload);
    return {
      success: true,
      provider: "knock",
      messageId: result.workflow_run_id,
    };
  } catch (error) {
    return errorResult(workflow, error);
  }
}

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
}): Promise<KnockResult> {
  return triggerWorkflow("credit_due", {
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
}

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
}): Promise<KnockResult> {
  return triggerWorkflow("kb_article_published", {
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
}

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
}): Promise<KnockResult> {
  return triggerWorkflow("admin_alert", {
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
}

export async function notifyAccountEvent({
  topic,
  userId,
  email,
  eventType,
  metadata,
}: {
  topic?: string;
  userId: string;
  email: string;
  eventType: "signup" | "password_change" | "suspicious_activity";
  metadata?: Record<string, any>;
}): Promise<KnockResult> {
  return triggerWorkflow(topic || "account_event", {
    recipients: [
      {
        id: userId,
        email,
      },
    ],
    data: {
      event_type: eventType,
      metadata,
    },
  });
}

export async function notifyBillingNotice({
  userId,
  email,
  noticeType,
  amountCents,
  dueDate,
  payload,
}: {
  userId: string;
  email: string;
  noticeType: "invoice_posted" | "payment_received" | "payment_failed";
  amountCents: number;
  dueDate?: string;
  payload?: Record<string, any>;
}): Promise<KnockResult> {
  return triggerWorkflow("billing_notice", {
    recipients: [
      {
        id: userId,
        email,
      },
    ],
    data: {
      notice_type: noticeType,
      amount_cents: amountCents,
      due_date: dueDate,
      payload,
    },
  });
}

export async function notifyExportReady({
  userId,
  email,
  exportId,
  downloadUrl,
}: {
  userId: string;
  email: string;
  exportId: string;
  downloadUrl: string;
}): Promise<KnockResult> {
  return triggerWorkflow("export_ready", {
    recipients: [
      {
        id: userId,
        email,
      },
    ],
    data: {
      export_id: exportId,
      download_url: downloadUrl,
    },
  });
}
