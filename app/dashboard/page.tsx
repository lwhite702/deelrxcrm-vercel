import React from "react";
import dynamic from "next/dynamic";

// Ensure client-only code (hooks, localStorage) runs on client.
const DashboardClient = dynamic(() => import("./DashboardClient"), { ssr: false });

export default function DashboardPage() {
  return <DashboardClient />;
}
