import React from "react";
import dynamic from "next/dynamic";

const PaymentsClient = dynamic(() => import("./PaymentsClient"), {
  ssr: false,
});

export default function PaymentsPage() {
  return <PaymentsClient />;
}
