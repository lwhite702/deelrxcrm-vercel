"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Users, CreditCard, Lock, Eye, DollarSign, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative px-6 py-24 mx-auto max-w-7xl lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className={cn(
            "text-5xl font-bold tracking-tight sm:text-7xl",
            "bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
          )}>
            Run the Block. Run the Business.
          </h1>
          <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
            Track product, customers, and profits—secure, private, and built for the hustle.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className={cn(
              "shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300",
              "hover:scale-105"
            )}>
              <Link href="/signup">Start Free Today</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className={cn(
              "shadow-lg shadow-secondary/25 hover:shadow-secondary/40 transition-all duration-300",
              "hover:scale-105"
            )}>
              <Link href="/demo">See It in Action</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - 7 tiles */}
      <section className="py-24 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Stay Sharp
          </h2>
        </div>
        <div className="mx-auto mt-16 max-w-7xl grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card className={cn(
            "group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300",
            "border-primary/20 hover:border-primary/40"
          )}>
            <CardHeader>
              <Database className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-primary">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Complete view of inventory, customers, and cash flow in one clean interface.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(
            "group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300",
            "border-primary/20 hover:border-primary/40"
          )}>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-primary">Product Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track batches, adjustments, and movement. Know what's moving, what's not.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(
            "group hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300",
            "border-secondary/20 hover:border-secondary/40"
          )}>
            <CardHeader>
              <Users className="h-8 w-8 text-secondary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-secondary">Customer Loyalty</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Keep regulars close. Track referrals. Build relationships that pay.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(
            "group hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300",
            "border-secondary/20 hover:border-secondary/40"
          )}>
            <CardHeader>
              <CreditCard className="h-8 w-8 text-secondary mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-secondary">Instant Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Fast payouts where supported. Keep your ledger tight and cash flowing.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(
            "group hover:shadow-lg hover:shadow-accent/20 transition-all duration-300",
            "border-accent/20 hover:border-accent/40"
          )}>
            <CardHeader>
              <Lock className="h-8 w-8 text-accent mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-accent">Privacy Locked</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                MFA protection, encrypted data, and role-based access controls.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(
            "group hover:shadow-lg hover:shadow-accent/20 transition-all duration-300",
            "border-accent/20 hover:border-accent/40"
          )}>
            <CardHeader>
              <Eye className="h-8 w-8 text-accent mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-accent">Untraceable Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Masked IDs, optional self-destruct features for maximum privacy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className={cn(
            "group hover:shadow-lg hover:shadow-chart-4/20 transition-all duration-300",
            "border-chart-4/20 hover:border-chart-4/40"
          )}>
            <CardHeader>
              <DollarSign className="h-8 w-8 text-chart-4 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <CardTitle className="text-chart-4">Real Income Clarity</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Clear profit margins, expense tracking, and real-time financial insights.
              </CardDescription>
            </CardContent>
          </Card>
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
            speed, and control in one platform built by those who understand the game.
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
          <Card className="text-center border-muted">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <div className="text-4xl font-bold text-primary">Free</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">1 team</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">100 customers</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Basic dashboard</span>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "text-center relative border-primary shadow-lg shadow-primary/25",
            "ring-2 ring-primary/50"
          )}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3">Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="text-4xl font-bold text-primary">
                $29<span className="text-lg text-muted-foreground">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Unlimited customers & inventory</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Payments & refunds</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Loyalty & referrals</span>
              </div>
            </CardContent>
          </Card>

          <Card className="text-center border-muted">
            <CardHeader>
              <CardTitle className="text-2xl">Business</CardTitle>
              <div className="text-4xl font-bold text-primary">Custom</div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Multi-team</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Advanced controls</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Priority support</span>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="secondary" size="lg" className={cn(
            "shadow-lg shadow-secondary/25 hover:shadow-secondary/40 transition-all duration-300"
          )}>
            <Link href="/pricing">Compare Plans</Link>
          </Button>
        </div>
      </section>

      {/* Footer with Legal Disclaimer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center space-y-6">
            <p className="text-sm text-muted-foreground">
              © 2025 DeelRxCRM by Wrelik Brands, LLC. DeelRxCRM is a general-purpose CRM.
            </p>
            
            <Card className={cn(
              "inline-block border-destructive/20 bg-destructive/5",
              "shadow-lg shadow-destructive/10"
            )}>
              <CardContent className="p-4">
                <p className="text-sm text-destructive font-semibold">
              <p className="text-sm text-destructive font-semibold">
                <strong>LEGAL DISCLAIMER:</strong> This software must only be used for lawful business purposes in compliance with 21 U.S.C. § 801 et seq. and local regulations. 
                It must not be used for any illegal drug or controlled substance activity. 
                Users are responsible for operating in compliance with all applicable laws.
              </p>
                </p>
              </CardContent>
            </Card>
            
            <div className="flex justify-center space-x-6">
              <Button asChild variant="link" size="sm" className="text-muted-foreground hover:text-primary">
                <Link href="/terms">Terms of Service</Link>
              </Button>
              <Button asChild variant="link" size="sm" className="text-muted-foreground hover:text-primary">
                <Link href="/privacy">Privacy Policy</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}