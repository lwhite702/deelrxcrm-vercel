import React from "react";
import dynamic from "next/dynamic";

const SuperAdminClient = dynamic(() => import("./SuperAdminClient"), { ssr: false });

export default function SuperAdminPage() { return <SuperAdminClient />; }
