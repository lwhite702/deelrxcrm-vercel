import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { deliveries } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1).default("US"),
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
  { params }: { params: Promise<{ teamId: string; deliveryId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, deliveryId } = await params;

    // TODO: Add team membership validation

    const [delivery] = await db
      .select()
      .from(deliveries)
      .where(
        and(eq(deliveries.id, deliveryId), eq(deliveries.tenantId, teamId))
      );

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("Delivery GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; deliveryId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, deliveryId } = await params;

    // TODO: Add team membership validation

    const body = await request.json();
    const validatedData = updateDeliverySchema.parse(body);

    // Build update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    // Convert date strings to Date objects
    if (validatedData.estimatedDeliveryAt) {
      updateData.estimatedDeliveryAt = new Date(
        validatedData.estimatedDeliveryAt
      );
    }

    if (validatedData.actualDeliveryAt) {
      updateData.actualDeliveryAt = new Date(validatedData.actualDeliveryAt);
    }

    const [updatedDelivery] = await db
      .update(deliveries)
      .set(updateData)
      .where(
        and(eq(deliveries.id, deliveryId), eq(deliveries.tenantId, teamId))
      )
      .returning();

    if (!updatedDelivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ delivery: updatedDelivery });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Delivery PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; deliveryId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId, deliveryId } = await params;

    // TODO: Add team membership validation

    const [deletedDelivery] = await db
      .delete(deliveries)
      .where(
        and(eq(deliveries.id, deliveryId), eq(deliveries.tenantId, teamId))
      )
      .returning();

    if (!deletedDelivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Delivery deleted successfully" });
  } catch (error) {
    console.error("Delivery DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
