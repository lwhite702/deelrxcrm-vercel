import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { customerReferrals } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

const updateReferralSchema = z.object({
  status: z.enum(["pending", "converted", "expired"]).optional(),
  referredCustomerId: z.string().uuid().optional(),
  rewardPaid: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; referralId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, referralId } = await params;

    // TODO: Add team membership validation

    const body = await request.json();
    const validatedData = updateReferralSchema.parse(body);

    // Build update data
    const updateData: any = { ...validatedData };
    
    if (validatedData.status === "converted") {
      updateData.convertedAt = new Date();
    }

    const [updatedReferral] = await db
      .update(customerReferrals)
      .set(updateData)
      .where(and(
        eq(customerReferrals.id, referralId),
        eq(customerReferrals.tenantId, teamId)
      ))
      .returning();

    if (!updatedReferral) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ referral: updatedReferral });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Referral PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; referralId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, referralId } = await params;

    // TODO: Add team membership validation

    const [deletedReferral] = await db
      .delete(customerReferrals)
      .where(and(
        eq(customerReferrals.id, referralId),
        eq(customerReferrals.tenantId, teamId)
      ))
      .returning();

    if (!deletedReferral) {
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Referral deleted successfully" });
  } catch (error) {
    console.error("Referral DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}