import { NextResponse } from "next/server";
import { getCurrentUserId, getMembership, setActiveTenant } from "@/lib/tenant";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId } = await request.json();
  if (!tenantId)
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  const membership = await getMembership(userId, tenantId);
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await setActiveTenant(tenantId);
  return NextResponse.json({ ok: true });
}
