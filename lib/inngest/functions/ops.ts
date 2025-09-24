import { inngest } from "../client";
import { db } from "@/lib/db/drizzle";
import { jobExecutions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface ReserveResult {
  status: "processing" | "completed";
}

async function reserveJob(
  jobKey: string,
  jobType: string,
  payload: Record<string, any>
): Promise<ReserveResult> {
  const existing = await db
    .select()
    .from(jobExecutions)
    .where(eq(jobExecutions.jobKey, jobKey))
    .limit(1);

  if (existing[0]?.status === "completed") {
    return { status: "completed" };
  }

  const now = new Date();

  await db
    .insert(jobExecutions)
    .values({
      jobKey,
      jobType,
      status: "processing",
      attempts: 1,
      payload,
      runAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: jobExecutions.jobKey,
      set: {
        status: "processing",
        attempts: sql`${jobExecutions.attempts} + 1`,
        payload,
        runAt: now,
        updatedAt: now,
        lastError: null,
      },
    });

  return { status: "processing" };
}

async function markCompleted(jobKey: string) {
  const now = new Date();
  await db
    .update(jobExecutions)
    .set({
      status: "completed",
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(jobExecutions.jobKey, jobKey));
}

async function markFailed(jobKey: string, error: unknown) {
  const now = new Date();
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  await db
    .update(jobExecutions)
    .set({
      status: "failed",
      lastError: message,
      updatedAt: now,
    })
    .where(eq(jobExecutions.jobKey, jobKey));
}

async function processWithBackoff<T>(
  step: any,
  jobKey: string,
  maxAttempts: number,
  handler: () => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await handler();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
      const delay = Math.min(5 * 60 * 1000, 1000 * Math.pow(2, attempt - 1));
      await step.sleep(`backoff-${jobKey}-${attempt}`, `${delay}ms`);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Job failed without specific error");
}

export const generateOperationsReport = inngest.createFunction(
  { id: "ops-report-generate", name: "Generate KPI Report" },
  { event: "reports.generate" },
  async ({ event, step }) => {
    const jobKey = `report:${event.data.reportId}`;

    const reservation = await step.run("reserve-job", () =>
      reserveJob(jobKey, "report", event.data)
    );

    if (reservation.status === "completed") {
      return { status: "duplicate", jobKey };
    }

    const maxAttempts = event.data.maxAttempts ?? 3;

    try {
      await processWithBackoff(step, jobKey, maxAttempts, async () => {
        // Simulate heavy report creation work such as aggregating metrics
        await step.run("gather-metrics", async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
        });

        await step.run("render-artifacts", async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
        });
      });

      await step.run("mark-completed", () => markCompleted(jobKey));
      return { status: "completed", jobKey };
    } catch (error) {
      await step.run("mark-failed", () => markFailed(jobKey, error));
      await step.sendEvent("queue-dlq", {
        name: "jobs.dead_letter",
        data: {
          jobKey,
          jobType: "report",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  }
);

export const exportInventoryCsv = inngest.createFunction(
  { id: "ops-export-inventory", name: "Export Inventory CSV" },
  { event: "exports.inventory" },
  async ({ event, step }) => {
    const jobKey = `export:${event.data.exportId}`;

    const reservation = await step.run("reserve-job", () =>
      reserveJob(jobKey, "export", event.data)
    );

    if (reservation.status === "completed") {
      return { status: "duplicate", jobKey };
    }

    const maxAttempts = event.data.maxAttempts ?? 3;

    try {
      await processWithBackoff(step, jobKey, maxAttempts, async () => {
        await step.run("prepare-rows", async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
        });

        await step.run("stream-to-storage", async () => {
          // In production this would push to object storage or send email
          await new Promise((resolve) => setTimeout(resolve, 150));
        });
      });

      await step.run("mark-completed", () => markCompleted(jobKey));
      return { status: "completed", jobKey };
    } catch (error) {
      await step.run("mark-failed", () => markFailed(jobKey, error));
      await step.sendEvent("queue-dlq", {
        name: "jobs.dead_letter",
        data: {
          jobKey,
          jobType: "export",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  }
);

export const nightlyOperationsSummary = inngest.createFunction(
  { id: "ops-nightly-summary", name: "Nightly Operations Summary" },
  { cron: "0 4 * * *" },
  async ({ event, step }) => {
    const dateKey = new Date(event?.ts ?? Date.now()).toISOString().split("T")[0];
    const jobKey = `nightly:${dateKey}`;

    const reservation = await step.run("reserve-job", () =>
      reserveJob(jobKey, "nightly", { date: dateKey })
    );

    if (reservation.status === "completed") {
      return { status: "duplicate", jobKey };
    }

    try {
      await step.run("compile-snapshot", async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      await step.run("mark-completed", () => markCompleted(jobKey));
      return { status: "completed", jobKey };
    } catch (error) {
      await step.run("mark-failed", () => markFailed(jobKey, error));
      await step.sendEvent("queue-dlq", {
        name: "jobs.dead_letter",
        data: {
          jobKey,
          jobType: "nightly",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  }
);
