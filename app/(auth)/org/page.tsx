"use client";
import React from "react";
import { OrganizationProfile } from "@clerk/nextjs";

export default function OrganizationProfilePage() {
  return (
    <div className="flex min-h-screen p-6 justify-center">
      <OrganizationProfile path="/org" routing="path" />
    </div>
  );
}
