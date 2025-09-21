import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "../../../../../server/db";
import { products } from "../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../server/rbac";
import { parseJson, json, badRequest } from "../../../../../server/http";

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sku: z.string().optional(),
  priceCents: z.number().int().min(0),
  costCents: z.number().int().min(0).optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const updateProductSchema = createProductSchema.partial();

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
    const category = url.searchParams.get("category");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(products.tenantId, tenantId)];

    if (isActive !== null) {
      conditions.push(eq(products.isActive, isActive === "true"));
    }

    if (category) {
      conditions.push(eq(products.category, category));
    }

    const productList = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return json({ products: productList });
  } catch (error) {
    console.error("Products GET error:", error);
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

    // Check tenant membership and role (managers+ can create products)
    await requireTenantRole(user.id, tenantId, "manager");

    const body = await parseJson(request);
    const validatedData = createProductSchema.parse(body);

    const db = getDb();

    const [newProduct] = await db
      .insert(products)
      .values({
        ...validatedData,
        tenantId,
        createdBy: user.id,
      })
      .returning();

    return json({ product: newProduct }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Products POST error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
