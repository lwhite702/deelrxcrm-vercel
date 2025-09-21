import React from "react";
import dynamic from "next/dynamic";
const PosClient = dynamic(() => import("./PosClient"), { ssr: false });
export default function PosPage() {
  return <PosClient />;
}
