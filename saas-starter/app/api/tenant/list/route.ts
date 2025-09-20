import { NextResponse } from "next/server";
import { getCurrentUserId, listUserTenants } from "@/lib/tenant";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenants = await listUserTenants(userId);
  return NextResponse.json(tenants);
}
