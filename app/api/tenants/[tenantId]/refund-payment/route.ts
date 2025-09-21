import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { getDb } from "../../../../../server/db";
import { payments, orders } from "../../../../../server/db/schema";
import { requireTenantRole } from "../../../../../server/rbac";
import { parseJson, json } from "../../../../../server/http";

// Validation schema
const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.number().int().min(1).optional(), // If not provided, refund full amount
  reason: z.string().max(500).optional(),
});

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripeClient = new Stripe(secret, { apiVersion: "2023-10-16" });
  return stripeClient;
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
    
    // Check tenant membership and role (managers+ can process refunds)
    await requireTenantRole(user.id, tenantId, "manager");

    const body = await parseJson(request);
    const validatedData = refundPaymentSchema.parse(body);

    const db = getDb();
    
    // Find the payment
    const payment = await db.query.payments.findFirst({
      where: and(
        eq(payments.id, validatedData.paymentId), 
        eq(payments.tenantId, tenantId)
      ),
    });

    if (!payment) {
      return json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "succeeded") {
      return json({ error: "Payment is not in a refundable state" }, { status: 400 });
    }

    if (!payment.stripePaymentIntentId) {
      return json({ error: "Payment was not processed through Stripe" }, { status: 400 });
    }

    // Calculate refund amount
    const refundAmountCents = validatedData.amountCents || payment.amountCents;
    const maxRefundable = payment.amountCents - (payment.refundAmountCents || 0);
    
    if (refundAmountCents > maxRefundable) {
      return json({ 
        error: "Refund amount exceeds refundable amount",
        maxRefundable 
      }, { status: 400 });
    }

    // Process refund with Stripe
    const stripe = getStripeClient();
    
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmountCents,
      reason: validatedData.reason ? "requested_by_customer" : undefined,
      metadata: {
        tenantId,
        paymentId: payment.id,
        processedBy: user.id,
        reason: validatedData.reason || "",
      },
    });

    // Update payment record
    const newRefundTotal = (payment.refundAmountCents || 0) + refundAmountCents;
    const newStatus = newRefundTotal >= payment.amountCents ? "refunded" : "succeeded";

    const [updatedPayment] = await db
      .update(payments)
      .set({
        status: newStatus,
        refundAmountCents: newRefundTotal,
        refundedAt: newStatus === "refunded" ? new Date() : payment.refundedAt,
        updatedAt: new Date(),
        metadata: {
          ...payment.metadata as any,
          lastRefund: {
            refundId: refund.id,
            amount: refundAmountCents,
            processedBy: user.id,
            processedAt: new Date().toISOString(),
            reason: validatedData.reason,
          },
        },
      })
      .where(and(eq(payments.id, payment.id), eq(payments.tenantId, tenantId)))
      .returning();

    // Update order status if fully refunded
    if (newStatus === "refunded" && payment.orderId) {
      await db
        .update(orders)
        .set({
          status: "refunded",
          updatedAt: new Date(),
          updatedBy: user.id,
        })
        .where(and(eq(orders.id, payment.orderId), eq(orders.tenantId, tenantId)));
    }

    return json({
      refund: {
        id: refund.id,
        amount: refundAmountCents,
        status: refund.status,
        created: refund.created,
      },
      payment: updatedPayment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    
    // Handle Stripe errors
    if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeError') {
      return json({ 
        error: "Stripe error", 
        message: (error as any).message,
        code: (error as any).code,
      }, { status: 400 });
    }
    
    console.error("Refund payment error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}