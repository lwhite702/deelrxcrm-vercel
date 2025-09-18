import React from "react";
import dynamic from "next/dynamic";

const DeliveryClient = dynamic(() => import("./DeliveryClient"), { ssr: false });

export default function DeliveryPage() { return <DeliveryClient />; }
