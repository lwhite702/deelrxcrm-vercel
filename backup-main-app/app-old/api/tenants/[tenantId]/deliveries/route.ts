import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "server/db";
import { deliveries } from "server/db/schema";
import { eq } from "drizzle-orm";
import { requireTenantRole } from "server/rbac";

const DeliverySchema = z.object({
  method: z.enum(["pickup", "local", "mail"]),
  costCents: z.number().int().nonnegative().default(0),
  address: z.any().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { tenantId: string } }
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.tenantId, params.tenantId));
  return NextResponse.json({ data: rows });
}

export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  const body = DeliverySchema.parse(await req.json());
  const user = await currentUser();
  const userId = user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantRole(userId, params.tenantId, "manager");
  const db = getDb();
  const [row] = await db
    .insert(deliveries)
    .values({ ...body, tenantId: params.tenantId })
    .returning();
  return NextResponse.json({ data: row }, { status: 201 });
}
