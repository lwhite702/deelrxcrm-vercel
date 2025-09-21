"use client";

import React from "react";
import Link from "next/link";
import {
  OrganizationSwitcher,
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";

export default function GlobalHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/landing" className="text-xl font-bold text-primary urban-text-glow">
              DeelRxCRM
            </Link>
            <OrganizationSwitcher
              hidePersonal={false}
              appearance={{
                elements: {
                  organizationSwitcherTrigger: {
                    background: "transparent",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                  },
                },
              }}
            />
          </div>
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <UserButton 
                afterSignOutUrl="/landing"
                appearance={{
                  elements: {
                    avatarBox: "border-2 border-primary/20 hover:border-primary transition-colors",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
