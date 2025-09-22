import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { purgeOperations } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createPurgeOperationSchema = z.object({
  teamId: z.string().uuid(),
  operationType: z.enum([
    "customer_data",
    "transaction_history",
    "full_account",
    "inactive_accounts",
  ]),
  targetDate: z.string().datetime().optional(),
  retentionDays: z.number().int().min(1).max(3650).optional(), // 1 day to 10 years
  criteria: z.record(z.any()).optional(),
  scheduledFor: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

const updatePurgeOperationSchema = z.object({
  status: z
    .enum([
      "requested",
      "scheduled",
      "export_ready",
      "acknowledged",
      "executing",
      "completed",
      "cancelled",
    ])
    .optional(),
  exportUrl: z.string().url().optional(),
  completedAt: z.string().datetime().optional(),
  errorMessage: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role validation

    // Get query parameters
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");
    const status = url.searchParams.get("status");
    const operationType = url.searchParams.get("type");
    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [];

    if (teamId) {
      conditions.push(eq(purgeOperations.teamId, parseInt(teamId)));
    }

    if (status) {
      conditions.push(eq(purgeOperations.status, status as any));
    }

    // Note: operationType is stored in purgeScope.entities JSON field
    // Complex filtering would require JSON queries - implement if needed

    if (fromDate) {
      conditions.push(gte(purgeOperations.createdAt, new Date(fromDate)));
    }

    if (toDate) {
      conditions.push(lte(purgeOperations.createdAt, new Date(toDate)));
    }

    const operations = await db
      .select()
      .from(purgeOperations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(purgeOperations.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ operations });
  } catch (error) {
    console.error("Purge operations GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role validation

    const body = await request.json();
    const validatedData = createPurgeOperationSchema.parse(body);

    const [newOperation] = await db
      .insert(purgeOperations)
      .values({
        teamId: parseInt(validatedData.teamId),
        purgeScope: {
          entities: [validatedData.operationType],
          dateRange: validatedData.targetDate ? {
            from: validatedData.targetDate,
            to: new Date().toISOString()
          } : undefined,
          criteria: validatedData.criteria,
        },
        scheduledFor: validatedData.scheduledFor
          ? new Date(validatedData.scheduledFor)
          : undefined,
        requestedBy: user.id,
      })
      .returning();

    // TODO: Schedule background job with Inngest for processing
    // await inngest.send({
    //   name: "admin/purge.requested",
    //   data: { operationId: newOperation.id }
    // });

    return NextResponse.json({ operation: newOperation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Purge operations POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
