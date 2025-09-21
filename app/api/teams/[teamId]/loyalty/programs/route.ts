import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { loyaltyPrograms } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  pointsPerDollar: z.number().int().min(1).default(1),
  dollarsPerPoint: z.number().int().min(1).default(100), // cents value of 1 point
  minimumRedemption: z.number().int().min(1).default(100),
  expirationMonths: z.number().int().min(1).optional(),
});

const updateProgramSchema = createProgramSchema.partial();

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
    const isActive = url.searchParams.get("active");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(loyaltyPrograms.tenantId, teamId)];

    if (isActive !== null) {
      conditions.push(eq(loyaltyPrograms.isActive, isActive === "true"));
    }

    const programsList = await db
      .select()
      .from(loyaltyPrograms)
      .where(and(...conditions))
      .orderBy(desc(loyaltyPrograms.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ programs: programsList });
  } catch (error) {
    console.error("Loyalty Programs GET error:", error);
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
    const validatedData = createProgramSchema.parse(body);

    const [newProgram] = await db
      .insert(loyaltyPrograms)
      .values({
        ...validatedData,
        tenantId: teamId,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ program: newProgram }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Loyalty Programs POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}