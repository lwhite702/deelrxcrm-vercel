import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { payments } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createPaymentSchema = z.object({
  orderId: z.string().uuid().optional(),
  stripePaymentIntentId: z.string().optional(),
  amountCents: z.number().int().min(0),
  currency: z.string().default("usd"),
  status: z.enum(["pending", "succeeded", "failed", "cancelled", "refunded"]).default("pending"),
  method: z.enum(["card", "cash", "check", "bank_transfer", "other"]).default("card"),
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
    const status = url.searchParams.get("status");
    const orderId = url.searchParams.get("orderId");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(payments.tenantId, teamId)];

    if (status) {
      conditions.push(eq(payments.status, status as any));
    }

    if (orderId) {
      conditions.push(eq(payments.orderId, orderId));
    }

    const paymentList = await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ payments: paymentList });
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const validatedData = createPaymentSchema.parse(body);

    const [newPayment] = await db
      .insert(payments)
      .values({
        ...validatedData,
        tenantId: teamId,
      })
      .returning();

    return NextResponse.json({ payment: newPayment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}