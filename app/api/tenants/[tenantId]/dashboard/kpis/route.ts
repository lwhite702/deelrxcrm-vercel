import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "../../../../../../server/db";
import {
  products,
  customers,
  orders,
  payments,
} from "../../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../../server/rbac";
import { sql, eq, and, count, sum } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const { tenantId } = params;

    // Verify authentication and tenant access
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has at least viewer role for this tenant
    await requireTenantRole(user.id, tenantId, "viewer");

    const db = getDb();

    // Get total sales (sum of all succeeded payments)
    const totalSalesResult = await db
      .select({ total: sum(payments.amountCents) })
      .from(payments)
      .where(
        and(eq(payments.tenantId, tenantId), eq(payments.status, "succeeded"))
      );

    const totalSales = totalSalesResult[0]?.total || 0;

    // Get total customers
    const totalCustomersResult = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));

    const totalCustomers = totalCustomersResult[0]?.count || 0;

    // Get total orders
    const totalOrdersResult = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.tenantId, tenantId));

    const totalOrders = totalOrdersResult[0]?.count || 0;

    // Get total products
    const totalProductsResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    const totalProducts = totalProductsResult[0]?.count || 0;

    // Get low stock products (where stockQuantity <= 10)
    const lowStockProductsResult = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          sql`${products.stockQuantity} <= 10`,
          eq(products.isActive, true)
        )
      );

    const lowStockProducts = lowStockProductsResult[0]?.count || 0;

    // Get recent orders with customer names
    const recentOrdersResult = await db
      .select({
        id: orders.id,
        totalCents: orders.totalCents,
        status: orders.status,
        createdAt: orders.createdAt,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.tenantId, tenantId))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(5);

    const recentOrders = recentOrdersResult.map((order: any) => ({
      id: order.id,
      total: order.totalCents,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      customerName: order.customerFirstName
        ? `${order.customerFirstName} ${order.customerLastName || ""}`.trim()
        : undefined,
    }));

    const kpis = {
      totalSales: Number(totalSales),
      totalCustomers,
      totalOrders,
      totalProducts,
      lowStockProducts,
      recentOrders,
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Dashboard KPIs API error:", error);

    if (error instanceof Error) {
      // @ts-ignore Check for custom status property
      const status = error.status || 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
