import { z } from "zod";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "../../../../../../server/db";
import { inventoryAdjustments } from "../../../../../../server/db/schema";
import { eq } from "drizzle-orm";
import { parseJson, json } from "../../../../../../server/http";
import { requireTenantRole } from "../../../../../../server/rbac";

const AdjustmentSchema = z.object({
  item: z.string().min(1),
  quantity: z.number().int(),
  reason: z.enum(["waste", "sample", "personal", "recount"]),
  note: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { tenantId: string } }
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(inventoryAdjustments)
    .where(eq(inventoryAdjustments.tenantId, params.tenantId));
  return json({ data: rows });
}

export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  const body = AdjustmentSchema.parse(await parseJson(req));
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) return json({ error: "Unauthorized" }, 401);
  await requireTenantRole(userId, params.tenantId, "manager");
  const db = getDb();
  const [row] = await db
    .insert(inventoryAdjustments)
    .values({ ...body, tenantId: params.tenantId, createdBy: userId })
    .returning();
  return json({ data: row }, 201);
}
