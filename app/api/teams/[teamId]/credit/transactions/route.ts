import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { creditTransactions } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createTransactionSchema = z.object({
  creditId: z.string().uuid(),
  transactionType: z.enum(["charge", "payment", "fee", "adjustment"]),
  amount: z.number().int(), // amount in cents
  description: z.string().optional(),
  orderId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Get query parameters
    const url = new URL(request.url);
    const creditId = url.searchParams.get("creditId");
    const status = url.searchParams.get("status");
    const transactionType = url.searchParams.get("type");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(creditTransactions.teamId, parseInt(teamId))];

    if (creditId) {
      conditions.push(eq(creditTransactions.creditId, creditId));
    }

    if (status) {
      conditions.push(eq(creditTransactions.status, status as any));
    }

    if (transactionType) {
      conditions.push(
        eq(creditTransactions.transactionType, transactionType as any)
      );
    }

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(and(...conditions))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("Credit transactions GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handles the creation of a new credit transaction.
 *
 * This function first retrieves the user and checks for authorization. It then extracts the teamId from the parameters and validates the request body against a predefined schema. If validation passes, it inserts the new transaction into the database and returns the created transaction. In case of validation errors or other exceptions, appropriate error responses are returned.
 *
 * @param request - The NextRequest object containing the request data.
 * @param params - An object containing a Promise that resolves to an object with the teamId.
 * @returns A JSON response containing the created transaction or an error message.
 * @throws z.ZodError If the request body fails validation against the schema.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // TODO: Add admin role validation for creating transactions

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    const [newTransaction] = await db
      .insert(creditTransactions)
      .values({
        ...validatedData,
        teamId: parseInt(teamId),
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : undefined,
        idempotencyKey:
          validatedData.idempotencyKey ||
          `${teamId}-${Date.now()}-${Math.random()}`,
      })
      .returning();

    return NextResponse.json({ transaction: newTransaction }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Credit transactions POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
