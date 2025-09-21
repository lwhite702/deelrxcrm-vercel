import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, eq, desc, ilike, or } from "drizzle-orm";
import { getDb } from "../../../../../server/db";
import { customers } from "../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../server/rbac";
import { parseJson, json } from "../../../../../server/http";

// Validation schemas
const addressSchema = z
  .object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  })
  .optional();

const createCustomerSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: addressSchema,
  dateOfBirth: z.string().datetime().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateCustomerSchema = createCustomerSchema.partial();

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = params;

    // Check tenant membership and role
    await requireTenantRole(user.id, tenantId, "member");

    const db = getDb();

    // Get query parameters
    const url = new URL(request.url);
    const isActive = url.searchParams.get("active");
    const search = url.searchParams.get("search");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(customers.tenantId, tenantId)];

    if (isActive !== null) {
      conditions.push(eq(customers.isActive, isActive === "true"));
    }

    if (search) {
      // Simple search on first name for now
      conditions.push(ilike(customers.firstName, `%${search}%`));
    }

    const customerList = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return json({ customers: customerList });
  } catch (error) {
    console.error("Customers GET error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = params;

    // Check tenant membership and role (members+ can create customers)
    await requireTenantRole(user.id, tenantId, "member");

    const body = await parseJson(request);
    const validatedData = createCustomerSchema.parse(body);

    const db = getDb();

    const [newCustomer] = await db
      .insert(customers)
      .values({
        ...validatedData,
        tenantId,
        createdBy: user.id,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : undefined,
      })
      .returning();

    return json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Customers POST error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
