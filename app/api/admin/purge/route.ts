import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { purgeOperations } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createPurgeOperationSchema = z.object({
  teamId: z.number().int().positive(),
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

/**
 * Handles the GET request for purge operations.
 *
 * This function retrieves user information and validates authorization. It then extracts query parameters from the request URL, constructs conditions for querying the database, and fetches the relevant purge operations based on the specified filters. If any errors occur during the process, an appropriate error response is returned.
 *
 * @param request - The NextRequest object containing the request details.
 * @returns A JSON response containing the fetched operations or an error message.
 * @throws Error If an internal server error occurs during the operation.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role validation

    // Get query parameters
    const url = new URL(request.url);
    const teamIdStr = url.searchParams.get("teamId");
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

    if (teamIdStr) {
      const teamId = parseInt(teamIdStr);
      if (!isNaN(teamId)) {
        conditions.push(eq(purgeOperations.teamId, teamId));
      }
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

/**
 * Handles the POST request for creating a purge operation.
 *
 * This function retrieves the current user, validates the request body against a schema, and inserts a new purge operation into the database.
 * It also handles potential validation errors and returns appropriate responses based on the outcome of the operation.
 *
 * @param request - The incoming NextRequest object containing the request data.
 * @returns A JSON response containing the newly created operation or an error message.
 * @throws z.ZodError If the request body fails validation.
 */
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
        teamId: validatedData.teamId,
        requestedBy: user.id,
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
