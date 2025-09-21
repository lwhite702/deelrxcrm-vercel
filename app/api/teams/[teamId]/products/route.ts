import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { products } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

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
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(products.tenantId, teamId)];

    if (isActive !== null) {
      conditions.push(eq(products.isActive, isActive === "true"));
    }

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    const productList = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ products: productList });
  } catch (error) {
    console.error("Products GET error:", error);
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
    const validatedData = createProductSchema.parse(body);

    const [newProduct] = await db
      .insert(products)
      .values({
        ...validatedData,
        tenantId: teamId,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Products POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
