import React from "react";
import dynamic from "next/dynamic";
const LoyaltyClient = dynamic(() => import("./LoyaltyClient"), { ssr: false });
export default function LoyaltyPage() { return <LoyaltyClient />; }
