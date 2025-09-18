import React from "react";
import dynamic from "next/dynamic";

const InventoryClient = dynamic(() => import("./InventoryClient"), {
  ssr: false,
});

export default function InventoryPage() {
  return <InventoryClient />;
}
