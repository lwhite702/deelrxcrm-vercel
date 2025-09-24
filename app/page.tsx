import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-purple-500">
                Experience the Future
              </span>
              <span className="block">of CRM</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful customer relationship management with modern payment processing and reconciliation tools.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button asChild size="lg" className="px-8 py-4 text-lg font-semibold">
                <Link href="/dashboard">Get Started</Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold">
                <Link href="/payments">Manual Reconciliation</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-background via-muted/40 to-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Complete Payment Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage payments and reconcile transactions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Payment Processing</h3>
              <p className="text-muted-foreground">
                Process payments securely with advanced fraud protection and real-time monitoring.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Manual Reconciliation</h3>
              <p className="text-muted-foreground">
                Reconcile transactions manually with powerful tools and detailed reporting.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Track performance with comprehensive analytics and customizable reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-16 bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Ready to get started?</h3>
            <p className="text-muted-foreground">
              Join thousands of businesses using our platform for payment management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8 py-4">
                <Link href="/dashboard">Start Free Trial</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-4">
                <Link href="/payments">Access Reconciliation Tools</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}