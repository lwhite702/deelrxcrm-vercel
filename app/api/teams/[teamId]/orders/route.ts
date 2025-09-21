import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { orders, orderItems } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1),
  productSku: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
  totalPriceCents: z.number().int().min(0),
});

const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  orderNumber: z.string().min(1),
  status: z.enum(["draft", "pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]).default("draft"),
  subtotalCents: z.number().int().min(0),
  taxCents: z.number().int().min(0).default(0),
  totalCents: z.number().int().min(0),
  notes: z.string().optional(),
  shippingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  items: z.array(orderItemSchema),
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
    const status = url.searchParams.get("status");
    const customerId = url.searchParams.get("customerId");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(orders.tenantId, teamId)];

    if (status) {
      conditions.push(eq(orders.status, status as any));
    }

    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }

    const orderList = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ orders: orderList });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    const validatedData = createOrderSchema.parse(body);

    // Use transaction to create order and order items
    const result = await db.transaction(async (tx) => {
      // Create the order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          tenantId: teamId,
          customerId: validatedData.customerId,
          orderNumber: validatedData.orderNumber,
          status: validatedData.status,
          subtotalCents: validatedData.subtotalCents,
          taxCents: validatedData.taxCents,
          totalCents: validatedData.totalCents,
          notes: validatedData.notes,
          shippingAddress: validatedData.shippingAddress,
          billingAddress: validatedData.billingAddress,
          createdBy: user.id,
        })
        .returning();

      // Create order items
      if (validatedData.items && validatedData.items.length > 0) {
        const orderItemsData = validatedData.items.map(item => ({
          tenantId: teamId,
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          totalPriceCents: item.totalPriceCents,
        }));

        await tx.insert(orderItems).values(orderItemsData);
      }

      return newOrder;
    });

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}