import { z } from "zod";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "server/db";
import { deliveries } from "server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTenantRole } from "server/rbac";

const PatchSchema = z.object({
  method: z.enum(["pickup", "local", "mail"]).optional(),
  costCents: z.number().int().nonnegative().optional(),
  address: z.any().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { tenantId: string; id: string } }
) {
  const db = getDb();
  const row = await db.query.deliveries.findFirst({
    where: and(
      eq(deliveries.tenantId, params.tenantId),
      eq(deliveries.id, params.id)
    ),
  });
  if (!row) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({ data: row });
}

export async function PATCH(
  req: Request,
  { params }: { params: { tenantId: string; id: string } }
) {
  const body = PatchSchema.parse(await req.json());
  const user = await currentUser();
  const userId = user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantRole(userId, params.tenantId, "manager");
  const db = getDb();
  const [row] = await db
    .update(deliveries)
    .set({ ...body, updatedAt: new Date() })
    .where(
      and(
        eq(deliveries.tenantId, params.tenantId),
        eq(deliveries.id, params.id)
      )
    )
    .returning();
  if (!row) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({ data: row });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { tenantId: string; id: string } }
) {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireTenantRole(userId, params.tenantId, "manager");
  const db = getDb();
  const [row] = await db
    .delete(deliveries)
    .where(
      and(
        eq(deliveries.tenantId, params.tenantId),
        eq(deliveries.id, params.id)
      )
    )
    .returning();
  if (!row) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json({ data: true });
}
