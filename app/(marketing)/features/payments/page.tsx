'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Shield,
  Smartphone,
  Users,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGate } from 'statsig-react';
import { FEATURE_GATES } from '@/lib/feature-gates';

export default function PaymentsFeaturePage() {
  const manualUiKilled = useGate(FEATURE_GATES.KILL_PAYMENTS).value;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <section className="py-24 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="text-center">
          <h1
            className={cn(
              'text-4xl font-bold tracking-tight sm:text-6xl mb-4',
              'bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'
            )}
          >
            Payment Processing & Reconciliation
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Handle payments your way—manual reconciliation now, card processing
            coming soon. Track every transaction with precision and keep your
            cash flow transparent.
          </p>
        </div>
      </section>

      {manualUiKilled ? (
        <section className="px-6 mx-auto max-w-4xl lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Manual payment onboarding is temporarily paused. Reach out to the
              DeelRx CRM team if you need it re-enabled.
            </AlertDescription>
          </Alert>
        </section>
      ) : null}

      {/* Current & Coming Soon Features */}
      <section className="py-16 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Manual Reconciliation - Available Now */}
          <Card className="border-primary/20 shadow-lg shadow-primary/10">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl text-primary">
                    Manual Reconciliation
                  </CardTitle>
                  <Badge variant="default" className="mt-1">
                    Available Now
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-base">
                Track and reconcile all your payment methods with detailed
                records and notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">
                  Supported Payment Methods
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-secondary" />
                    <span>Zelle transfers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-secondary" />
                    <span>Apple Pay transactions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-secondary" />
                    <span>Cash App payments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-secondary" />
                    <span>Cash transactions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-secondary" />
                    <span>Custom payment methods with notes</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Features</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>Reference numbers & handles tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>Transaction notes and attachments (stub)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>No platform fees on manual entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>Real-time balance updates</span>
                  </div>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href="/dashboard/payments">Start Manual Entry</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Card Processing - Coming Soon */}
          <Card className="border-secondary/20 shadow-lg shadow-secondary/10 relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-8 w-8 text-secondary" />
                <div>
                  <CardTitle className="text-2xl text-secondary">
                    Card Processing
                  </CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    Coming Soon
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-base">
                Built-in credit and debit card processing with competitive rates
                and fast payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 opacity-75">
              <div>
                <h4 className="font-semibold mb-3">Planned Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-accent" />
                    <span>Credit & debit card processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-accent" />
                    <span>Contactless payments (NFC)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-accent" />
                    <span>Customer payment profiles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span>Instant & scheduled payouts</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">
                  Transparent Fee Structure
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Processing Fee</span>
                    <span>3.5% + $0.30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Street Tax</span>
                    <span>+0.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Instant Payout</span>
                    <span>+1.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chargeback Fee</span>
                    <span>$15.00</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Example: $100 transaction</span>
                    <span>$4.30 fee</span>
                  </div>
                </div>
              </div>

              <Button disabled className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 mx-auto max-w-7xl lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Why DeelRx Payment Processing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for businesses that need flexibility, security, and
            transparency in every transaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Bank-Level Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All payment data encrypted with enterprise-grade security. Your
                customers' information stays protected.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <DollarSign className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Transparent Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                No hidden fees, no monthly minimums. You only pay when you
                process, and every fee is clearly disclosed.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle>Compliance Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                PCI DSS compliant processing ensures your business meets all
                regulatory requirements automatically.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 mx-auto max-w-4xl lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Streamline Your Payments?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Start with manual reconciliation today, then upgrade to card
          processing when it launches.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className={cn(
              'shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300'
            )}
          >
            <Link href="/signup">Start Free Today</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className={cn(
              'shadow-lg shadow-secondary/25 hover:shadow-secondary/40 transition-all duration-300'
            )}
          >
            <Link href="/dashboard/payments">Try Manual Entry</Link>
          </Button>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <Card
            className={cn(
              'border-destructive/20 bg-destructive/5 max-w-4xl mx-auto',
              'shadow-lg shadow-destructive/10'
            )}
          >
            <CardContent className="p-4">
              <p className="text-sm text-destructive font-semibold text-center">
                <p className="text-sm text-destructive font-semibold text-center">
                  <strong>LEGAL DISCLAIMER:</strong> This software must only be
                  used for lawful business purposes in compliance with 21 U.S.C.
                  § 801 et seq. and local regulations. It must not be used for
                  any illegal drug or controlled substance activity. Users are
                  responsible for operating in compliance with all applicable
                  laws.
                </p>
              </p>
            </CardContent>
          </Card>
        </div>
      </footer>
    </div>
  );
}
