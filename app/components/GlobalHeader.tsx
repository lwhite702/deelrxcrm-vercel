"use client";

import React from "react";
import {
  OrganizationSwitcher,
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";

export default function GlobalHeader() {
  return (
    <header style={{ borderBottom: "1px solid #e6e6e6", padding: "8px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <OrganizationSwitcher
            hidePersonal={false}
            appearance={{
              elements: {
                organizationSwitcherTrigger: { background: "transparent" },
              },
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
