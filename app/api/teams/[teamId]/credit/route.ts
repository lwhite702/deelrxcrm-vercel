import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, sum } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { credits, creditTransactions } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const updateCreditSchema = z.object({
  creditLimit: z.string().transform((val) => parseInt(val)).optional(),
  customerId: z.string().uuid().optional(),
  status: z.enum(['active', 'suspended', 'closed', 'defaulted']).optional(),
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

    // TODO: Add team membership validation

    // Get credit record for team
    const [creditRecord] = await db
      .select()
      .from(credits)
      .where(eq(credits.teamId, teamId))
      .limit(1);

    // Get current balance by summing all successful transactions
    const balanceResult = await db
      .select({ 
        totalBalance: sum(creditTransactions.amount)
      })
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.teamId, teamId),
        eq(creditTransactions.status, 'completed')
      ));

    const currentBalance = parseInt(balanceResult[0]?.totalBalance || '0');

    // Get recent transactions
    const recentTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.teamId, teamId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(10);

    const response = {
      creditLimit: creditRecord?.creditLimit || 0,
      currentBalance,
      availableCredit: (creditRecord?.creditLimit || 0) - currentBalance,
      status: creditRecord?.status || 'active',
      customerId: creditRecord?.customerId,
      recentTransactions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Credit GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // TODO: Add admin role validation

    const body = await request.json();
    const validatedData = updateCreditSchema.parse(body);

    // Check if credit record exists
    const [existingCredit] = await db
      .select()
      .from(credits)
      .where(eq(credits.teamId, teamId))
      .limit(1);

    let creditRecord;

    if (existingCredit) {
      // Update existing record
      [creditRecord] = await db
        .update(credits)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(credits.teamId, teamId))
        .returning();
    } else {
      // Create new record - requires customerId
      if (!validatedData.customerId) {
        return NextResponse.json(
          { error: "customerId is required for new credit accounts" },
          { status: 400 }
        );
      }

      [creditRecord] = await db
        .insert(credits)
        .values({
          teamId,
          customerId: validatedData.customerId,
          creditLimit: validatedData.creditLimit || 0,
          status: validatedData.status || 'active',
        })
        .returning();
    }

    return NextResponse.json({ credit: creditRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Credit PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}