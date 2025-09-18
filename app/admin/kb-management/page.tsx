import React from "react";
import dynamic from "next/dynamic";
const KbManagementClient = dynamic(() => import("./KbManagementClient"), {
  ssr: false,
});
/**
 * Renders the KbManagementClient component.
 */
export default function KbManagementPage() {
  return <KbManagementClient />;
}
