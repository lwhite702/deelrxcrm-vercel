"use client";
import React from "react";
import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="flex min-h-screen p-6 justify-center">
      <UserProfile path="/user" routing="path" />
    </div>
  );
}
