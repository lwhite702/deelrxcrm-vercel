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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Star, Shield, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = {
  monthly: [
    {
      name: 'Starter',
      price: 0,
      description: 'Perfect for getting started',
      icon: Shield,
      features: [
        '1 team member',
        'Up to 100 customers',
        'Basic dashboard',
        'Manual payments only (Zelle, Apple Pay, Cash App, Cash, custom)',
        'Email support',
        'Standard encryption',
      ],
      limitations: [
        'No card processing (Coming Soon)',
        'No loyalty programs',
        'No advanced reporting',
      ],
      cta: 'Start Free',
      href: '/signup',
      popular: false,
    },
    {
      name: 'Pro',
      price: 29,
      description: 'Most popular for growing businesses',
      icon: Zap,
      features: [
        'Up to 5 team members',
        'Unlimited customers',
        'Advanced dashboard',
        'Manual payments now. Card processing Coming Soon',
        'Loyalty & referrals',
        'Priority support',
        'Advanced encryption',
        'Custom fields',
        'API access',
      ],
      limitations: [],
      cta: 'Start Pro Trial',
      href: '/signup?plan=pro',
      popular: true,
    },
    {
      name: 'Business',
      price: 99,
      description: 'For established operations',
      icon: Crown,
      features: [
        'Unlimited team members',
        'Unlimited customers',
        'Manual payments now. Card processing Coming Soon',
        'White-label options',
        'Advanced integrations',
        'Custom workflows',
        'Dedicated support',
        'Enterprise encryption',
        'Advanced analytics',
        'Compliance tools',
        'Data export',
      ],
      limitations: [],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false,
    },
  ],
  yearly: [
    {
      name: 'Starter',
      price: 0,
      description: 'Perfect for getting started',
      icon: Shield,
      features: [
        '1 team member',
        'Up to 100 customers',
        'Basic dashboard',
        'Manual payments only (Zelle, Apple Pay, Cash App, Cash, custom)',
        'Email support',
        'Standard encryption',
      ],
      limitations: [
        'No card processing (Coming Soon)',
        'No loyalty programs',
        'No advanced reporting',
      ],
      cta: 'Start Free',
      href: '/signup',
      popular: false,
    },
    {
      name: 'Pro',
      price: 290,
      originalPrice: 348,
      description: 'Most popular for growing businesses',
      icon: Zap,
      features: [
        'Up to 5 team members',
        'Unlimited customers',
        'Advanced dashboard',
        'Manual payments now. Card processing Coming Soon',
        'Loyalty & referrals',
        'Priority support',
        'Advanced encryption',
        'Custom fields',
        'API access',
      ],
      limitations: [],
      cta: 'Start Pro Trial',
      href: '/signup?plan=pro&billing=yearly',
      popular: true,
    },
    {
      name: 'Business',
      price: 990,
      originalPrice: 1188,
      description: 'For established operations',
      icon: Crown,
      features: [
        'Unlimited team members',
        'Unlimited customers',
        'Manual payments now. Card processing Coming Soon',
        'White-label options',
        'Advanced integrations',
        'Custom workflows',
        'Dedicated support',
        'Enterprise encryption',
        'Advanced analytics',
        'Compliance tools',
        'Data export',
      ],
      limitations: [],
      cta: 'Contact Sales',
      href: '/contact',
      popular: false,
    },
  ],
};

/**
 * Renders the Pricing Page component with pricing options and related information.
 */
export default function PricingPage() {
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
            Simple Pricing, Real Results
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your hustle. All plans include our core
            CRM features with enterprise-grade security.
          </p>
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="px-6 mx-auto max-w-7xl lg:px-8">
        <Tabs defaultValue="monthly" className="w-full">
          <div className="flex justify-center mb-16">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="relative">
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">
                  Save 17%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monthly">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {plans.monthly.map((plan, index) => (
                <PricingCard key={plan.name} plan={plan} billing="monthly" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="yearly">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {plans.yearly.map((plan, index) => (
                <PricingCard key={plan.name} plan={plan} billing="yearly" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Payment Fees Section */}
      <section className="py-12 px-6 mx-auto max-w-4xl lg:px-8">
        <div className="space-y-6">
          <Alert>
            <AlertDescription>
              Card processing is not yet available. Manual reconciliation has no
              platform fee from DeelRxCRM.
            </AlertDescription>
          </Alert>

          <Card className="border-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Payment Processing Fees
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>
                Fee schedule activates when card processing launches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-muted-foreground opacity-60">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-6 mx-auto max-w-4xl lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="card-processing">
            <AccordionTrigger>Can I process cards now?</AccordionTrigger>
            <AccordionContent>
              Not yet. Card processing is <strong>Coming Soon</strong>. Today
              you can reconcile Zelle, Apple Pay, Cash App, Cash, or custom
              methods.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="fees-today">
            <AccordionTrigger>Are there fees today?</AccordionTrigger>
            <AccordionContent>
              No platform fee for manual reconciliation. Card fees apply once
              processing launches.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="manual-methods">
            <AccordionTrigger>
              What manual payment methods are supported?
            </AccordionTrigger>
            <AccordionContent>
              Zelle, Apple Pay, Cash App, Cash, and custom payment methods with
              reference notes and tracking.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* All Plans Include */}
      <section className="py-24 px-6 mx-auto max-w-4xl lg:px-8">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">All Plans Include</CardTitle>
            <CardDescription>
              Enterprise-grade security and privacy features built for
              professional operations
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span>End-to-end encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-secondary" />
              <span>GDPR compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span>Multi-factor authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-secondary" />
              <span>Regular security audits</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span>Data masking & anonymization</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-secondary" />
              <span>99.9% uptime SLA</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 mx-auto max-w-4xl lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Run Your Business Like a CEO?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of entrepreneurs who've upgraded their operations with
          DeelRxCRM.
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
            <Link href="/demo">Book a Demo</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function PricingCard({ plan, billing }: { plan: any; billing: string }) {
  const Icon = plan.icon;

  return (
    <Card
      className={cn(
        'relative transition-all duration-300 hover:shadow-lg',
        plan.popular
          ? 'border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/50'
          : 'border-muted hover:border-primary/40'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              'p-3 rounded-lg',
              plan.popular ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                plan.popular ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
        </div>

        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm">
          {plan.description}
        </CardDescription>

        <div className="mt-4">
          {plan.price === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold">${plan.price}</span>
              <div className="text-left">
                <div className="text-sm text-muted-foreground">
                  /{billing === 'yearly' ? 'year' : 'month'}
                </div>
                {plan.originalPrice && (
                  <div className="text-xs text-muted-foreground line-through">
                    ${plan.originalPrice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          {plan.features.map((feature: string, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}

          {plan.limitations.map((limitation: string, index: number) => (
            <div key={index} className="flex items-center gap-3 opacity-60">
              <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                {limitation}
              </span>
            </div>
          ))}
        </div>

        <Button
          asChild
          className={cn(
            'w-full',
            plan.popular
              ? 'shadow-lg shadow-primary/25 hover:shadow-primary/40'
              : 'shadow-lg shadow-secondary/25 hover:shadow-secondary/40'
          )}
          variant={plan.popular ? 'default' : 'secondary'}
        >
          <Link href={plan.href}>{plan.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
