"use client";
import React from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignUp path="/signup" routing="path" signInUrl="/login" />
    </div>
  );
}
