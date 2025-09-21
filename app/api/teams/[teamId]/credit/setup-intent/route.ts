import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { credits } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

// Validation schemas
const createSetupIntentSchema = z.object({
  creditId: z.string().uuid(),
  customerEmail: z.string().email().optional(),
});

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

    const body = await request.json();
    const { creditId, customerEmail } = createSetupIntentSchema.parse(body);

    // Verify credit account belongs to team
    const [creditAccount] = await db
      .select()
      .from(credits)
      .where(eq(credits.id, creditId))
      .limit(1);

    if (!creditAccount || creditAccount.teamId !== teamId) {
      return NextResponse.json(
        { error: "Credit account not found" },
        { status: 404 }
      );
    }

    // Create SetupIntent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerEmail ? undefined : await getOrCreateStripeCustomer(customerEmail),
      usage: 'off_session', // For future payments
      metadata: {
        creditId,
        teamId,
        userId: user.id,
      },
    });

    // Update credit record with SetupIntent ID
    await db
      .update(credits)
      .set({
        setupIntentId: setupIntent.id,
        updatedAt: new Date(),
      })
      .where(eq(credits.id, creditId));

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Setup intent POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getOrCreateStripeCustomer(email?: string): Promise<string | undefined> {
  if (!email) return undefined;
  
  // Search for existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({ email });
  return customer.id;
}