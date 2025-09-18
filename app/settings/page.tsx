import React from "react";
import dynamic from "next/dynamic";

const SettingsClient = dynamic(() => import("./SettingsClient"), { ssr: false });

export default function SettingsPage() { return <SettingsClient />; }
