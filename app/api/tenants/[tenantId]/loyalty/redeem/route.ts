import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "server/db";
import {
  loyaltyAccounts,
  loyaltyEvents,
  loyaltyTransactions,
} from "server/db/schema";
import { eq } from "drizzle-orm";
import { requireTenantRole } from "server/rbac";

const RedeemSchema = z.object({
  customerId: z.string().min(1),
  points: z.number().int().positive(),
});

export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  const body = RedeemSchema.parse(await req.json());
  const user = await currentUser();
  const userId = user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantRole(userId, params.tenantId, "manager");
  const db = getDb();
  const acct = await db.query.loyaltyAccounts.findFirst({
    where: eq(loyaltyAccounts.customerId, body.customerId),
  });
  if (!acct)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const cur = acct.balance ?? 0;
  if (cur < body.points)
    return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
  const newBal = cur - body.points;
  await db
    .update(loyaltyAccounts)
    .set({ balance: newBal })
    .where(eq(loyaltyAccounts.id, acct.id));
  await db
    .insert(loyaltyEvents)
    .values({
      tenantId: params.tenantId,
      accountId: acct.id,
      type: "redemption",
      points: -body.points,
    });
  await db
    .insert(loyaltyTransactions)
    .values({
      tenantId: params.tenantId,
      accountId: acct.id,
      points: -body.points,
      description: "Redemption",
    });
  return NextResponse.json({
    data: { customerId: body.customerId, balance: newBal },
  });
}
