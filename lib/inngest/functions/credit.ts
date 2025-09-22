import { inngest } from "../client";
import { db } from "@/lib/db/drizzle";
import { credits, creditTransactions, teams } from "@/lib/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export const creditReminderDaily = inngest.createFunction(
  { id: "credit-reminder-daily" },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ event, step }) => {
    const today = new Date();
    const overdueDays = 30; // Consider overdue after 30 days

    // Get all credit accounts that are overdue
    const overdueCredits = await step.run("find-overdue-credits", async () => {
      return await db
        .select({
          creditId: credits.id,
          teamId: credits.teamId,
          customerId: credits.customerId,
          currentBalance: credits.currentBalance,
          creditLimit: credits.creditLimit,
          lastPaymentAt: credits.lastPaymentAt,
        })
        .from(credits)
        .leftJoin(teams, eq(credits.teamId, teams.id))
        .where(
          and(
            eq(credits.status, "active"),
            lt(
              sql`${credits.lastPaymentAt} + INTERVAL '${overdueDays} days'`,
              today
            )
          )
        );
    });

    // Process each overdue credit account
    for (const credit of overdueCredits) {
      await step.run(`process-credit-${credit.creditId}`, async () => {
        const daysSinceLastPayment = credit.lastPaymentAt
          ? Math.floor(
              (today.getTime() - new Date(credit.lastPaymentAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : overdueDays + 1;

        // Send reminder based on days overdue
        let reminderType = "gentle";
        if (daysSinceLastPayment > 60) {
          reminderType = "urgent";
        } else if (daysSinceLastPayment > 45) {
          reminderType = "firm";
        }

        // TODO: Get customer email from customer record
        // For now, we'll log the reminder
        console.log(`Credit reminder for ${credit.creditId}:`, {
          type: reminderType,
          daysOverdue: daysSinceLastPayment,
          balance: credit.currentBalance,
        });

        // Create a transaction record for the reminder
        await db.insert(creditTransactions).values({
          teamId: credit.teamId,
          creditId: credit.creditId,
          transactionType: "fee",
          amount: reminderType === "urgent" ? 2500 : 1000, // Late fee in cents
          description: `Late payment fee - ${reminderType} reminder`,
          status: "pending",
          idempotencyKey: `reminder-${credit.creditId}-${
            today.toISOString().split("T")[0]
          }`,
        });

        return {
          creditId: credit.creditId,
          reminderType,
          daysOverdue: daysSinceLastPayment,
        };
      });
    }

    return {
      processedCredits: overdueCredits.length,
      date: today.toISOString(),
    };
  }
);

export const creditPaymentFailed = inngest.createFunction(
  { id: "credit-payment-failed" },
  { event: "credit/payment.failed" },
  async ({ event, step }) => {
    const { teamId, creditId, transactionId, amount, reason } = event.data;

    // Update transaction status
    await step.run("update-transaction-status", async () => {
      await db
        .update(creditTransactions)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(creditTransactions.id, transactionId));
    });

    // Send notification to team admins
    await step.run("notify-payment-failure", async () => {
      // TODO: Implement email notification
      console.log(`Payment failed for credit ${creditId}:`, {
        amount: amount / 100,
        reason,
      });
    });

    // Schedule retry after 24 hours
    await step.run("schedule-retry", async () => {
      await inngest.send({
        name: "credit/retry.payment",
        data: {
          teamId,
          creditId,
          transactionId,
          attempt: 1,
          maxAttempts: 3,
        },
        delay: "24h",
      });
    });

    return { success: true };
  }
);

export const creditLimitExceeded = inngest.createFunction(
  { id: "credit-limit-exceeded" },
  { event: "credit/limit.exceeded" },
  async ({ event, step }) => {
    const { teamId, creditId, currentBalance, creditLimit } = event.data;

    // Suspend the credit account
    await step.run("suspend-credit-account", async () => {
      await db
        .update(credits)
        .set({
          status: "suspended",
          updatedAt: new Date(),
        })
        .where(eq(credits.id, creditId));
    });

    // Send urgent notification
    await step.run("send-urgent-notification", async () => {
      // TODO: Implement SMS and email alerts
      console.log(`URGENT: Credit limit exceeded for ${creditId}:`, {
        currentBalance: currentBalance / 100,
        creditLimit: creditLimit / 100,
        overage: (currentBalance - creditLimit) / 100,
      });
    });

    return { suspended: true };
  }
);
