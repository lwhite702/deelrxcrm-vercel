import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, or, ilike, sql } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { customerReferrals, customers } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createReferralSchema = z.object({
  referrerCustomerId: z.string().uuid(),
  referredEmail: z.string().email().optional(),
  referredPhone: z.string().optional(),
  referredCustomerId: z.string().uuid().optional(),
  rewardAmount: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
}).refine(
  (data) => data.referredEmail || data.referredPhone || data.referredCustomerId,
  {
    message: "Must provide either referredEmail, referredPhone, or referredCustomerId",
    path: ["referredEmail"],
  }
);

const updateReferralSchema = z.object({
  status: z.enum(["pending", "converted", "expired"]).optional(),
  referredCustomerId: z.string().uuid().optional(),
  rewardPaid: z.boolean().optional(),
  notes: z.string().optional(),
  convertedAt: z.string().datetime().optional(),
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
    const status = url.searchParams.get("status");
    const referrerCustomerId = url.searchParams.get("referrerCustomerId");
    const search = url.searchParams.get("search");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(customerReferrals.tenantId, teamId)];

    if (status) {
      conditions.push(eq(customerReferrals.status, status));
    }

    if (referrerCustomerId) {
      conditions.push(eq(customerReferrals.referrerCustomerId, referrerCustomerId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(customerReferrals.referredEmail, `%${search}%`),
          ilike(customerReferrals.referredPhone, `%${search}%`)
        )!
      );
    }

    // Fetch referrals with customer details
    const referralsList = await db
      .select({
        id: customerReferrals.id,
        referrerCustomerId: customerReferrals.referrerCustomerId,
        referrerName: sql<string>`${customers.firstName} || ' ' || COALESCE(${customers.lastName}, '')`,
        referredCustomerId: customerReferrals.referredCustomerId,
        referredEmail: customerReferrals.referredEmail,
        referredPhone: customerReferrals.referredPhone,
        status: customerReferrals.status,
        rewardAmount: customerReferrals.rewardAmount,
        rewardPaid: customerReferrals.rewardPaid,
        notes: customerReferrals.notes,
        createdAt: customerReferrals.createdAt,
        convertedAt: customerReferrals.convertedAt,
        expiresAt: customerReferrals.expiresAt,
      })
      .from(customerReferrals)
      .innerJoin(customers, eq(customerReferrals.referrerCustomerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(customerReferrals.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ referrals: referralsList });
  } catch (error) {
    console.error("Referrals GET error:", error);
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
    const validatedData = createReferralSchema.parse(body);

    // Validate referrer customer exists
    const [referrerCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(
        eq(customers.id, validatedData.referrerCustomerId),
        eq(customers.tenantId, teamId)
      ));

    if (!referrerCustomer) {
      return NextResponse.json(
        { error: "Referrer customer not found" },
        { status: 404 }
      );
    }

    // If referredCustomerId is provided, validate it exists
    if (validatedData.referredCustomerId) {
      const [referredCustomer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(
          eq(customers.id, validatedData.referredCustomerId),
          eq(customers.tenantId, teamId)
        ));

      if (!referredCustomer) {
        return NextResponse.json(
          { error: "Referred customer not found" },
          { status: 404 }
        );
      }
    }

    const [newReferral] = await db
      .insert(customerReferrals)
      .values({
        tenantId: teamId,
        referrerCustomerId: validatedData.referrerCustomerId,
        referredCustomerId: validatedData.referredCustomerId,
        referredEmail: validatedData.referredEmail,
        referredPhone: validatedData.referredPhone,
        rewardAmount: validatedData.rewardAmount,
        notes: validatedData.notes,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      })
      .returning();

    return NextResponse.json({ referral: newReferral }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Referrals POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}