import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../../server/db";
import {
  orders,
  orderItems,
  customers,
  products,
} from "../../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../../server/rbac";
import { json } from "../../../../../../server/http";

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

    // Get order with customer info
    const orderWithCustomer = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)))
      .limit(1);

    if (orderWithCustomer.length === 0) {
      return json({ error: "Order not found" }, { status: 404 });
    }

    // Get order items with product info
    const items = await db
      .select({
        item: orderItems,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(eq(orderItems.orderId, id), eq(orderItems.tenantId, tenantId))
      );

    return json({
      order: orderWithCustomer[0].order,
      customer: orderWithCustomer[0].customer,
      items,
    });
  } catch (error) {
    console.error("Order GET error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
