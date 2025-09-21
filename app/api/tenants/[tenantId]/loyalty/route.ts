import { NextResponse } from "next/server";
import { getDb } from "server/db";
import { loyaltyAccounts } from "server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { tenantId: string } }
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(loyaltyAccounts)
    .where(eq(loyaltyAccounts.tenantId, params.tenantId));
  const balances = rows.map((r) => ({
    customerId: r.customerId,
    balance: r.balance,
  }));
  return NextResponse.json({ data: balances });
}
