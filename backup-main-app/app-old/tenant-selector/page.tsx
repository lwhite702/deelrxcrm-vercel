import React from "react";
import dynamic from "next/dynamic";
const TenantSelectorClient = dynamic(() => import("./TenantSelectorClient"), {
  ssr: false,
});
export default function TenantSelectorPage() {
  return <TenantSelectorClient />;
}
