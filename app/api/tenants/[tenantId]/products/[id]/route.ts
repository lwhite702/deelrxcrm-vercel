import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../server/db";
import { products } from "../../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../../server/rbac";
import { parseJson, json } from "../../../../../../server/http";

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  priceCents: z.number().int().min(0).optional(),
  costCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
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
    
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    });

    if (!product) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    return json({ product });
  } catch (error) {
    console.error("Product GET error:", error);
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
    
    // Check tenant membership and role (managers+ can update products)
    await requireTenantRole(user.id, tenantId, "manager");

    const body = await parseJson(request);
    const validatedData = updateProductSchema.parse(body);

    const db = getDb();
    
    // Check if product exists and belongs to tenant
    const existingProduct = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    });

    if (!existingProduct) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();

    return json({ product: updatedProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Product PATCH error:", error);
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
    
    // Check tenant membership and role (managers+ can delete products)
    await requireTenantRole(user.id, tenantId, "manager");

    const db = getDb();
    
    // Check if product exists and belongs to tenant
    const existingProduct = await db.query.products.findFirst({
      where: and(eq(products.id, id), eq(products.tenantId, tenantId)),
    });

    if (!existingProduct) {
      return json({ error: "Product not found" }, { status: 404 });
    }

    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

    return json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}