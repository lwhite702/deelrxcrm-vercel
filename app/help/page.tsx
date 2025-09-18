import React from "react";
import dynamic from "next/dynamic";

const HelpClient = dynamic(() => import("./HelpClient"), { ssr: false });

export default function HelpPage() {
  return <HelpClient />;
}
