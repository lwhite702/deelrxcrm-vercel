import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../server/db";
import { customers } from "../../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../../server/rbac";
import { parseJson, json } from "../../../../../../server/http";

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
}).optional();

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: addressSchema,
  dateOfBirth: z.string().datetime().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, id } = params;
    
    // Check tenant membership and role
    await requireTenantRole(user.id, tenantId, "member");

    const db = getDb();
    
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
    });

    if (!customer) {
      return json({ error: "Customer not found" }, { status: 404 });
    }

    return json({ customer });
  } catch (error) {
    console.error("Customer GET error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, id } = params;
    
    // Check tenant membership and role (members+ can update customers)
    await requireTenantRole(user.id, tenantId, "member");

    const body = await parseJson(request);
    const validatedData = updateCustomerSchema.parse(body);

    const db = getDb();
    
    // Check if customer exists and belongs to tenant
    const existingCustomer = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
    });

    if (!existingCustomer) {
      return json({ error: "Customer not found" }, { status: 404 });
    }

    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: user.id,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .returning();

    return json({ customer: updatedCustomer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Customer PATCH error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantId: string; id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId, id } = params;
    
    // Check tenant membership and role (managers+ can delete customers)
    await requireTenantRole(user.id, tenantId, "manager");

    const db = getDb();
    
    // Check if customer exists and belongs to tenant
    const existingCustomer = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
    });

    if (!existingCustomer) {
      return json({ error: "Customer not found" }, { status: 404 });
    }

    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    return json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}