import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { inventoryAdjustments, products } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  adjustmentType: z.enum(["increase", "decrease", "correction"]),
  quantity: z.number().int().min(1),
  reason: z.enum(["waste", "sample", "personal", "recount", "damage", "theft", "expired", "other"]),
  notes: z.string().optional(),
});

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
    const productId = url.searchParams.get("productId");
    const reason = url.searchParams.get("reason");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(inventoryAdjustments.tenantId, teamId)];

    if (productId) {
      conditions.push(eq(inventoryAdjustments.productId, productId));
    }

    if (reason) {
      conditions.push(eq(inventoryAdjustments.reason, reason as any));
    }

    // Fetch adjustments with product details
    const adjustmentsList = await db
      .select({
        id: inventoryAdjustments.id,
        productId: inventoryAdjustments.productId,
        productName: products.name,
        productSku: products.sku,
        adjustmentType: inventoryAdjustments.adjustmentType,
        quantity: inventoryAdjustments.quantity,
        reason: inventoryAdjustments.reason,
        notes: inventoryAdjustments.notes,
        previousQuantity: inventoryAdjustments.previousQuantity,
        newQuantity: inventoryAdjustments.newQuantity,
        createdAt: inventoryAdjustments.createdAt,
        createdBy: inventoryAdjustments.createdBy,
      })
      .from(inventoryAdjustments)
      .innerJoin(products, eq(inventoryAdjustments.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(inventoryAdjustments.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ adjustments: adjustmentsList });
  } catch (error) {
    console.error("Adjustments GET error:", error);
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
    const validatedData = createAdjustmentSchema.parse(body);

    // Start transaction to update product stock and create adjustment record
    const result = await db.transaction(async (tx) => {
      // Get current product stock
      const [product] = await tx
        .select({ stockQuantity: products.stockQuantity })
        .from(products)
        .where(and(
          eq(products.id, validatedData.productId),
          eq(products.tenantId, teamId)
        ));

      if (!product) {
        throw new Error("Product not found");
      }

      const previousQuantity = product.stockQuantity;
      let newQuantity: number;

      // Calculate new quantity based on adjustment type
      switch (validatedData.adjustmentType) {
        case "increase":
          newQuantity = previousQuantity + validatedData.quantity;
          break;
        case "decrease":
          newQuantity = Math.max(0, previousQuantity - validatedData.quantity);
          break;
        case "correction":
          newQuantity = validatedData.quantity;
          break;
        default:
          throw new Error("Invalid adjustment type");
      }

      // Update product stock
      await tx
        .update(products)
        .set({ 
          stockQuantity: newQuantity,
          updatedAt: new Date(),
          updatedBy: user.id
        })
        .where(eq(products.id, validatedData.productId));

      // Create adjustment record
      const [adjustment] = await tx
        .insert(inventoryAdjustments)
        .values({
          tenantId: teamId,
          productId: validatedData.productId,
          adjustmentType: validatedData.adjustmentType,
          quantity: validatedData.adjustmentType === "correction" 
            ? Math.abs(newQuantity - previousQuantity)
            : validatedData.quantity,
          reason: validatedData.reason,
          notes: validatedData.notes,
          previousQuantity,
          newQuantity,
          createdBy: user.id,
        })
        .returning();

      return adjustment;
    });

    return NextResponse.json({ adjustment: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Adjustments POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}