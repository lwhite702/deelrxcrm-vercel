import React from "react";
import DashboardClient from "./DashboardClient";

async function fetchKPIs(tenantId: string) {
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    }/api/tenants/${tenantId}/dashboard/kpis`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  // TODO: Replace with real tenantId from auth/session
  const tenantId = "demo";
  const initialKPIs = await fetchKPIs(tenantId);
  return <DashboardClient initialKPIs={initialKPIs} />;
}
