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

const AccrueSchema = z.object({
  customerId: z.string().min(1),
  points: z.number().int().positive(),
});

export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  const body = AccrueSchema.parse(await req.json());
  const user = await currentUser();
  const userId = user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantRole(userId, params.tenantId, "manager");
  const db = getDb();
  let acct = await db.query.loyaltyAccounts.findFirst({
    where: eq(loyaltyAccounts.customerId, body.customerId),
  });
  if (!acct) {
    const [created] = await db
      .insert(loyaltyAccounts)
      .values({
        tenantId: params.tenantId,
        customerId: body.customerId,
        balance: 0,
      })
      .returning();
    acct = created;
  }
  const newBal = (acct.balance ?? 0) + body.points;
  await db
    .update(loyaltyAccounts)
    .set({ balance: newBal })
    .where(eq(loyaltyAccounts.id, acct.id));
  await db
    .insert(loyaltyEvents)
    .values({
      tenantId: params.tenantId,
      accountId: acct.id,
      type: "accrual",
      points: body.points,
    });
  await db
    .insert(loyaltyTransactions)
    .values({
      tenantId: params.tenantId,
      accountId: acct.id,
      points: body.points,
      description: "Accrual",
    });
  return NextResponse.json(
    { data: { customerId: body.customerId, balance: newBal } },
    { status: 201 }
  );
}
