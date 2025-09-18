import React from "react";
import dynamic from "next/dynamic";

const LandingClient = dynamic(() => import("./LandingClient"), { ssr: false });

export default function LandingPage() { return <LandingClient />; }
