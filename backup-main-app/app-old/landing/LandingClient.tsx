"use client";
import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative px-6 py-24 mx-auto max-w-7xl lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight urban-text-glow sm:text-7xl">
            Run the Block. Run the Business.
          </h1>
          <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
            DeelRxCRM helps you track product, customers, and money flow—fast, 
            simple, and built for the streets.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <Button size="lg">
                Start Free Today
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary" size="lg">
                See It in Action
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Stay Sharp
          </h2>
        </div>
        <div className="mx-auto mt-16 max-w-7xl grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="urban-card rounded-lg p-8 neon-focus">
            <h3 className="text-xl font-semibold mb-4 text-primary">All-in-One Dashboard</h3>
            <p className="text-muted-foreground">
              Inventory, customers, and payments in one clean view.
            </p>
          </div>
          <div className="urban-card rounded-lg p-8 neon-focus">
            <h3 className="text-xl font-semibold mb-4 text-primary">Product Control</h3>
            <p className="text-muted-foreground">
              Track batches and adjustments. See what's moving.
            </p>
          </div>
          <div className="urban-card rounded-lg p-8 neon-focus">
            <h3 className="text-xl font-semibold mb-4 text-primary">Customer Loyalty</h3>
            <p className="text-muted-foreground">
              Keep regulars close. Log referrals. Reward loyalty.
            </p>
          </div>
          <div className="urban-card rounded-lg p-8 neon-focus">
            <h3 className="text-xl font-semibold mb-4 text-primary">Instant Payments</h3>
            <p className="text-muted-foreground">
              Card and refunds where supported. Keep your ledger tight.
            </p>
          </div>
          <div className="urban-card rounded-lg p-8 neon-focus">
            <h3 className="text-xl font-semibold mb-4 text-primary">Street-Level Fast</h3>
            <p className="text-muted-foreground">
              Minimal clicks. Quick checkouts. Mobile-ready.
            </p>
          </div>
          <div className="urban-card rounded-lg p-8 neon-focus">
            <h3 className="text-xl font-semibold mb-4 text-primary">Locked & Encrypted</h3>
            <p className="text-muted-foreground">
              Role-based access and data encryption.
            </p>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-24 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Built for Hustlers Who Act Like CEOs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            You don't have time for chaos. DeelRxCRM cuts the noise so you can move smarter—clarity, 
            speed, and control in one platform.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple Pricing, Real Results
          </h2>
        </div>
        <div className="mx-auto mt-16 max-w-5xl grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="urban-card rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Starter</h3>
            <p className="text-4xl font-bold mb-4 text-primary">Free</p>
            <ul className="text-left space-y-2 mb-8 text-muted-foreground">
              <li>• 1 team</li>
              <li>• 100 customers</li>
              <li>• Basic dashboard</li>
            </ul>
          </div>
          <div className="urban-card rounded-lg p-8 text-center neon-glow">
            <h3 className="text-2xl font-bold mb-4">Pro</h3>
            <p className="text-4xl font-bold mb-4 text-primary">$29<span className="text-lg text-muted-foreground">/mo</span></p>
            <ul className="text-left space-y-2 mb-8 text-muted-foreground">
              <li>• Unlimited customers & inventory</li>
              <li>• Payments & refunds</li>
              <li>• Loyalty & referrals</li>
            </ul>
          </div>
          <div className="urban-card rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Business</h3>
            <p className="text-4xl font-bold mb-4 text-primary">Custom</p>
            <ul className="text-left space-y-2 mb-8 text-muted-foreground">
              <li>• Multi-team</li>
              <li>• Advanced controls</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-12">
          <Link href="/pricing">
            <Button variant="secondary" size="lg">
              Compare Plans
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer with Legal Disclaimer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              © 2025 DeelRxCRM by Wrelik Brands, LLC. DeelRxCRM is a general-purpose CRM.
            </p>
            <p className="text-sm text-destructive font-semibold bg-destructive/10 p-4 rounded-lg inline-block">
              <strong>LEGAL DISCLAIMER:</strong> It must not be used for any illegal drug or controlled substance activity. 
              Users are responsible for operating in compliance with all applicable laws.
            </p>
            <div className="mt-8 flex justify-center space-x-6">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
