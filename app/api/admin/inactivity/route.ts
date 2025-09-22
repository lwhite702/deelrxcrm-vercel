import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { inactivityPolicies, inactivityTrackers } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createPolicySchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  thresholdDays: z.number().int().min(1).max(3650),
  actions: z.object({
    warnings: z.array(z.number().int()).default([]),
    suspend: z.boolean().default(false),
    purge: z.boolean().default(false),
  }),
  isActive: z.boolean().default(true),
});

const updatePolicySchema = createPolicySchema.partial();

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
    const isActive = url.searchParams.get("active");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [];

    if (teamId) {
      conditions.push(eq(inactivityPolicies.teamId, teamId));
    }

    if (isActive !== null) {
      conditions.push(eq(inactivityPolicies.isActive, isActive === "true"));
    }

    const policies = await db
      .select()
      .from(inactivityPolicies)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inactivityPolicies.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Inactivity policies GET error:", error);
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
    const validatedData = createPolicySchema.parse(body);

    const [newPolicy] = await db
      .insert(inactivityPolicies)
      .values({
        ...validatedData,
      })
      .returning();

    return NextResponse.json({ policy: newPolicy }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Inactivity policies POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
