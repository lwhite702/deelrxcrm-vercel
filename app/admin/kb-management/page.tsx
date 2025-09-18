import React from "react";
import dynamic from "next/dynamic";
const KbManagementClient = dynamic(() => import("./KbManagementClient"), { ssr: false });
export default function KbManagementPage() { return <KbManagementClient />; }
