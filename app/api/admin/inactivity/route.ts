import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { inactivityPolicies, inactivityTrackers } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createPolicySchema = z.object({
  teamId: z.number().int().positive(),
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

/**
 * Handles the GET request for inactivity policies.
 *
 * This function retrieves the current user and checks for authorization. It then extracts query parameters such as teamId, active status, limit, and offset. Based on these parameters, it builds conditions to query the inactivityPolicies from the database, applying limits and offsets as specified. If any errors occur during the process, it logs the error and returns a 500 status response.
 *
 * @param request - The NextRequest object containing the request details.
 * @returns A JSON response containing the retrieved policies or an error message.
 * @throws Error If an internal server error occurs during the execution.
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
    const isActive = url.searchParams.get("active");
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
        conditions.push(eq(inactivityPolicies.teamId, teamId));
      }
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

/**
 * Handles the POST request to create a new inactivity policy.
 *
 * The function first retrieves the user and checks for authorization. If the user is not authorized, it returns a 401 response.
 * It then parses the request body and validates it against the createPolicySchema. If validation passes, it inserts the new policy
 * into the database and returns the created policy with a 201 status. If a validation error occurs, it returns a 400 response with
 * error details. Any other errors result in a 500 response.
 *
 * @param request - The NextRequest object containing the request data.
 * @returns A JSON response containing the created policy or an error message.
 * @throws z.ZodError If the request body fails validation against the schema.
 */
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
