"use client";

import React, { useEffect, useState } from "react";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

export default function ClerkClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const k =
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    setHasKey(!!k && k !== "pk_test_PLACEHOLDER");
  }, []);

  if (!hasKey) return <>{children}</>;

  return (
    <ClerkProvider>
      <div>
        <header
          style={{
            padding: 8,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        {children}
      </div>
    </ClerkProvider>
  );
}
