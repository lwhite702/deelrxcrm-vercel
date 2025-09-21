import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { customers } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

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
    const search = url.searchParams.get("search");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(customers.tenantId, teamId)];

    if (isActive !== null) {
      conditions.push(eq(customers.isActive, isActive === "true"));
    }

    if (search) {
      conditions.push(ilike(customers.firstName, `%${search}%`));
    }

    const customerList = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ customers: customerList });
  } catch (error) {
    console.error("Customers GET error:", error);
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
    const validatedData = createCustomerSchema.parse(body);

    const [newCustomer] = await db
      .insert(customers)
      .values({
        ...validatedData,
        tenantId: teamId,
        createdBy: user.id,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : undefined,
      })
      .returning();

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Customers POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
