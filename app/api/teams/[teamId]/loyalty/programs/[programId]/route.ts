import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { loyaltyPrograms } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

const updateProgramSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  pointsPerDollar: z.number().int().min(1).optional(),
  dollarsPerPoint: z.number().int().min(1).optional(),
  minimumRedemption: z.number().int().min(1).optional(),
  expirationMonths: z.number().int().min(1).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; programId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, programId } = await params;

    // TODO: Add team membership validation

    const [program] = await db
      .select()
      .from(loyaltyPrograms)
      .where(and(
        eq(loyaltyPrograms.id, programId),
        eq(loyaltyPrograms.tenantId, teamId)
      ));

    if (!program) {
      return NextResponse.json(
        { error: "Loyalty program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ program });
  } catch (error) {
    console.error("Loyalty Program GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; programId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, programId } = await params;

    // TODO: Add team membership validation

    const body = await request.json();
    const validatedData = updateProgramSchema.parse(body);

    const [updatedProgram] = await db
      .update(loyaltyPrograms)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(loyaltyPrograms.id, programId),
        eq(loyaltyPrograms.tenantId, teamId)
      ))
      .returning();

    if (!updatedProgram) {
      return NextResponse.json(
        { error: "Loyalty program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ program: updatedProgram });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Loyalty Program PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; programId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, programId } = await params;

    // TODO: Add team membership validation

    const [deletedProgram] = await db
      .delete(loyaltyPrograms)
      .where(and(
        eq(loyaltyPrograms.id, programId),
        eq(loyaltyPrograms.tenantId, teamId)
      ))
      .returning();

    if (!deletedProgram) {
      return NextResponse.json(
        { error: "Loyalty program not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Loyalty program deleted successfully" });
  } catch (error) {
    console.error("Loyalty Program DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}