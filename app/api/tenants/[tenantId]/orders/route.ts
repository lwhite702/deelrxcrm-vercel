import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "../../../../../server/db";
import { orders, orderItems, customers, products } from "../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../server/rbac";
import { parseJson, json } from "../../../../../server/http";

// Validation schemas
const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  unitPriceCents: z.number().int().min(0),
});

const createOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1),
  notes: z.string().optional(),
  discountCents: z.number().int().min(0).default(0),
  taxCents: z.number().int().min(0).default(0),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

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
    const status = url.searchParams.get("status");
    const customerId = url.searchParams.get("customerId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(orders.tenantId, tenantId)];
    
    if (status) {
      conditions.push(eq(orders.status, status as any));
    }
    
    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }

    const orderList = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return json({ orders: orderList });
  } catch (error) {
    console.error("Orders GET error:", error);
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
    
    // Check tenant membership and role (members+ can create orders)
    await requireTenantRole(user.id, tenantId, "member");

    const body = await parseJson(request);
    const validatedData = createOrderSchema.parse(body);

    const db = getDb();
    
    // Validate products exist and calculate totals
    let subtotalCents = 0;
    const orderItemsData = [];
    
    for (const item of validatedData.items) {
      const product = await db.query.products.findFirst({
        where: and(eq(products.id, item.productId), eq(products.tenantId, tenantId)),
      });
      
      if (!product) {
        return json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }
      
      const totalPriceCents = item.quantity * item.unitPriceCents;
      subtotalCents += totalPriceCents;
      
      orderItemsData.push({
        tenantId,
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalPriceCents,
      });
    }
    
    const totalCents = subtotalCents + validatedData.taxCents - validatedData.discountCents;
    
    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        tenantId,
        customerId: validatedData.customerId,
        orderNumber: generateOrderNumber(),
        status: "draft",
        subtotalCents,
        taxCents: validatedData.taxCents,
        discountCents: validatedData.discountCents,
        totalCents,
        notes: validatedData.notes,
        createdBy: user.id,
      })
      .returning();

    // Create order items
    const createdItems = await db
      .insert(orderItems)
      .values(
        orderItemsData.map(item => ({
          ...item,
          orderId: newOrder.id,
        }))
      )
      .returning();

    return json({ 
      order: newOrder,
      items: createdItems,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    console.error("Orders POST error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}