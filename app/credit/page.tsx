import React from "react";
import dynamic from "next/dynamic";
const CreditClient = dynamic(() => import("./CreditClient"), { ssr: false });
/** Renders the CreditClient component. */
export default function CreditPage() {
  return <CreditClient />;
}
