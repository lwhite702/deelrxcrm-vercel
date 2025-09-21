import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, ilike } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { deliveries, orders, customers } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1).default("US"),
});

const createDeliverySchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  method: z.enum([
    "pickup",
    "standard_delivery",
    "express_delivery",
    "overnight",
    "courier",
    "postal",
  ]),
  costCents: z.number().int().min(0).default(0),
  deliveryAddress: addressSchema,
  instructions: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const updateDeliverySchema = z.object({
  method: z
    .enum([
      "pickup",
      "standard_delivery",
      "express_delivery",
      "overnight",
      "courier",
      "postal",
    ])
    .optional(),
  status: z
    .enum([
      "pending",
      "assigned",
      "in_transit",
      "delivered",
      "failed",
      "returned",
    ])
    .optional(),
  costCents: z.number().int().min(0).optional(),
  deliveryAddress: addressSchema.optional(),
  instructions: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  actualDeliveryAt: z.string().datetime().optional(),
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
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");
    const customerId = url.searchParams.get("customerId");
    const search = url.searchParams.get("search"); // search by tracking number or customer name
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [eq(deliveries.tenantId, teamId)];

    if (status) {
      conditions.push(eq(deliveries.status, status as any));
    }

    if (method) {
      conditions.push(eq(deliveries.method, method as any));
    }

    if (customerId) {
      conditions.push(eq(deliveries.customerId, customerId));
    }

    if (search) {
      conditions.push(ilike(deliveries.trackingNumber, `%${search}%`));
    }

    // Fetch deliveries with order and customer details
    const deliveriesList = await db
      .select({
        id: deliveries.id,
        orderId: deliveries.orderId,
        orderNumber: orders.orderNumber,
        customerId: deliveries.customerId,
        customerName: customers.firstName,
        customerLastName: customers.lastName,
        method: deliveries.method,
        status: deliveries.status,
        costCents: deliveries.costCents,
        deliveryAddress: deliveries.deliveryAddress,
        instructions: deliveries.instructions,
        trackingNumber: deliveries.trackingNumber,
        estimatedDeliveryAt: deliveries.estimatedDeliveryAt,
        actualDeliveryAt: deliveries.actualDeliveryAt,
        notes: deliveries.notes,
        createdAt: deliveries.createdAt,
        updatedAt: deliveries.updatedAt,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .leftJoin(customers, eq(deliveries.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(deliveries.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ deliveries: deliveriesList });
  } catch (error) {
    console.error("Deliveries GET error:", error);
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
    const validatedData = createDeliverySchema.parse(body);

    // Validate order exists and belongs to tenant
    const [order] = await db
      .select({ id: orders.id, customerId: orders.customerId })
      .from(orders)
      .where(
        and(eq(orders.id, validatedData.orderId), eq(orders.tenantId, teamId))
      );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Use order's customer if not provided
    const customerId = validatedData.customerId || order.customerId;

    const [newDelivery] = await db
      .insert(deliveries)
      .values({
        tenantId: teamId,
        orderId: validatedData.orderId,
        customerId,
        method: validatedData.method,
        costCents: validatedData.costCents,
        deliveryAddress: validatedData.deliveryAddress,
        instructions: validatedData.instructions,
        trackingNumber: validatedData.trackingNumber,
        estimatedDeliveryAt: validatedData.estimatedDeliveryAt
          ? new Date(validatedData.estimatedDeliveryAt)
          : null,
        notes: validatedData.notes,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ delivery: newDelivery }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Deliveries POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
