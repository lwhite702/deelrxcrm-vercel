import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "deelrx-crm",
  name: "DeelRx CRM Background Jobs",
});

// Event types for Phase 3 operations
export type Events = {
  // Credit system events
  "credit/reminder.daily": {
    data: {
      teamId: string;
      creditId: string;
      daysOverdue: number;
      balance: number;
    };
  };
  "credit/payment.failed": {
    data: {
      teamId: string;
      creditId: string;
      transactionId: string;
      amount: number;
      reason: string;
    };
  };
  "credit/limit.exceeded": {
    data: {
      teamId: string;
      creditId: string;
      currentBalance: number;
      creditLimit: number;
    };
  };

  // Knowledge base events
  "kb/article.published": {
    data: {
      teamId: string;
      articleId: string;
      title: string;
      authorId: string;
    };
  };
  "kb/links.verify": {
    data: {
      teamId: string;
      articleId?: string;
    };
  };

  // Admin operations events
  "admin/inactivity.scan": {
    data: {
      teamId?: string;
      policyId?: string;
    };
  };
  "admin/purge.requested": {
    data: {
      operationId: string;
      teamId: string;
      operationType: string;
    };
  };
  "admin/purge.execute": {
    data: {
      operationId: string;
    };
  };

  // System maintenance events
  "system/cleanup.daily": {
    data: {
      date: string;
    };
  };
};
