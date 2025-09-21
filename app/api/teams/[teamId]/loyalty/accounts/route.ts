import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import {
  loyaltyAccounts,
  loyaltyEvents,
  loyaltyTransactions,
  loyaltyPrograms,
  customers,
} from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const accruePointsSchema = z.object({
  customerId: z.string().uuid(),
  programId: z.string().uuid(),
  points: z.number().int().min(1),
  orderId: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const redeemPointsSchema = z.object({
  customerId: z.string().uuid(),
  programId: z.string().uuid(),
  points: z.number().int().min(1),
  orderId: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
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

    // Get query parameters
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    const programId = url.searchParams.get("programId");
    const isActive = url.searchParams.get("active");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(loyaltyAccounts.tenantId, teamId)];

    if (customerId) {
      conditions.push(eq(loyaltyAccounts.customerId, customerId));
    }

    if (programId) {
      conditions.push(eq(loyaltyAccounts.programId, programId));
    }

    if (isActive !== null) {
      conditions.push(eq(loyaltyAccounts.isActive, isActive === "true"));
    }

    // Fetch accounts with program and customer details
    const accountsList = await db
      .select({
        id: loyaltyAccounts.id,
        customerId: loyaltyAccounts.customerId,
        customerName: sql<string>`${customers.firstName} || ' ' || COALESCE(${customers.lastName}, '')`,
        customerEmail: customers.email,
        programId: loyaltyAccounts.programId,
        programName: loyaltyPrograms.name,
        currentPoints: loyaltyAccounts.currentPoints,
        lifetimePoints: loyaltyAccounts.lifetimePoints,
        lifetimeRedeemed: loyaltyAccounts.lifetimeRedeemed,
        isActive: loyaltyAccounts.isActive,
        createdAt: loyaltyAccounts.createdAt,
        updatedAt: loyaltyAccounts.updatedAt,
      })
      .from(loyaltyAccounts)
      .innerJoin(
        loyaltyPrograms,
        eq(loyaltyAccounts.programId, loyaltyPrograms.id)
      )
      .innerJoin(customers, eq(loyaltyAccounts.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(loyaltyAccounts.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ accounts: accountsList });
  } catch (error) {
    console.error("Loyalty Accounts GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // TODO: Add team membership validation

    const body = await request.json();
    const { action } = body;

    if (action === "accrue") {
      return await accruePoints(body, teamId, user.id);
    } else if (action === "redeem") {
      return await redeemPoints(body, teamId, user.id);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accrue' or 'redeem'" },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Loyalty Action POST error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

async function accruePoints(body: any, teamId: string, userId: number) {
  const validatedData = accruePointsSchema.parse(body);

  return await db.transaction(async (tx) => {
    // Get or create loyalty account
    let [account] = await tx
      .select()
      .from(loyaltyAccounts)
      .where(
        and(
          eq(loyaltyAccounts.tenantId, teamId),
          eq(loyaltyAccounts.customerId, validatedData.customerId),
          eq(loyaltyAccounts.programId, validatedData.programId)
        )
      );

    if (!account) {
      // Verify customer and program exist
      const [customer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.id, validatedData.customerId),
            eq(customers.tenantId, teamId)
          )
        );

      const [program] = await tx
        .select({
          id: loyaltyPrograms.id,
          expirationMonths: loyaltyPrograms.expirationMonths,
        })
        .from(loyaltyPrograms)
        .where(
          and(
            eq(loyaltyPrograms.id, validatedData.programId),
            eq(loyaltyPrograms.tenantId, teamId)
          )
        );

      if (!customer || !program) {
        throw new Error("Customer or program not found");
      }

      // Create new account
      [account] = await tx
        .insert(loyaltyAccounts)
        .values({
          tenantId: teamId,
          customerId: validatedData.customerId,
          programId: validatedData.programId,
          currentPoints: 0,
          lifetimePoints: 0,
          lifetimeRedeemed: 0,
        })
        .returning();
    }

    const balanceBefore = account.currentPoints;
    const balanceAfter = balanceBefore + validatedData.points;

    // Create loyalty event
    const [event] = await tx
      .insert(loyaltyEvents)
      .values({
        tenantId: teamId,
        accountId: account.id,
        orderId: validatedData.orderId,
        type: "earned",
        points: validatedData.points,
        description:
          validatedData.description || `Earned ${validatedData.points} points`,
        metadata: validatedData.metadata,
        createdBy: userId,
      })
      .returning();

    // Calculate expiration date if program has expiration
    const [program] = await tx
      .select({ expirationMonths: loyaltyPrograms.expirationMonths })
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, validatedData.programId));

    let expiresAt: Date | null = null;
    if (program?.expirationMonths) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + program.expirationMonths);
    }

    // Create transaction record
    await tx.insert(loyaltyTransactions).values({
      tenantId: teamId,
      accountId: account.id,
      eventId: event.id,
      pointsChange: validatedData.points,
      balanceBefore,
      balanceAfter,
      expiresAt,
    });

    // Update account balances
    await tx
      .update(loyaltyAccounts)
      .set({
        currentPoints: balanceAfter,
        lifetimePoints: account.lifetimePoints + validatedData.points,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    return NextResponse.json(
      {
        message: "Points accrued successfully",
        points: validatedData.points,
        newBalance: balanceAfter,
      },
      { status: 201 }
    );
  });
}

async function redeemPoints(body: any, teamId: string, userId: number) {
  const validatedData = redeemPointsSchema.parse(body);

  return await db.transaction(async (tx) => {
    // Get loyalty account
    const [account] = await tx
      .select()
      .from(loyaltyAccounts)
      .where(
        and(
          eq(loyaltyAccounts.tenantId, teamId),
          eq(loyaltyAccounts.customerId, validatedData.customerId),
          eq(loyaltyAccounts.programId, validatedData.programId),
          eq(loyaltyAccounts.isActive, true)
        )
      );

    if (!account) {
      throw new Error("Loyalty account not found or inactive");
    }

    // Check if customer has enough points
    if (account.currentPoints < validatedData.points) {
      throw new Error(
        `Insufficient points. Available: ${account.currentPoints}, Requested: ${validatedData.points}`
      );
    }

    // Check minimum redemption amount
    const [program] = await tx
      .select({ minimumRedemption: loyaltyPrograms.minimumRedemption })
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.id, validatedData.programId));

    if (program && validatedData.points < program.minimumRedemption) {
      throw new Error(
        `Minimum redemption is ${program.minimumRedemption} points`
      );
    }

    const balanceBefore = account.currentPoints;
    const balanceAfter = balanceBefore - validatedData.points;

    // Create loyalty event
    const [event] = await tx
      .insert(loyaltyEvents)
      .values({
        tenantId: teamId,
        accountId: account.id,
        orderId: validatedData.orderId,
        type: "redeemed",
        points: validatedData.points,
        description:
          validatedData.description ||
          `Redeemed ${validatedData.points} points`,
        metadata: validatedData.metadata,
        createdBy: userId,
      })
      .returning();

    // Create transaction record
    await tx.insert(loyaltyTransactions).values({
      tenantId: teamId,
      accountId: account.id,
      eventId: event.id,
      pointsChange: -validatedData.points,
      balanceBefore,
      balanceAfter,
    });

    // Update account balances
    await tx
      .update(loyaltyAccounts)
      .set({
        currentPoints: balanceAfter,
        lifetimeRedeemed: account.lifetimeRedeemed + validatedData.points,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyAccounts.id, account.id));

    return NextResponse.json(
      {
        message: "Points redeemed successfully",
        points: validatedData.points,
        newBalance: balanceAfter,
      },
      { status: 200 }
    );
  });
}
