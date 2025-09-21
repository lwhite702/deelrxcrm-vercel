import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, Database } from "lucide-react";
import { Terminal } from "./terminal";

/**
 * Renders the HomePage component with various sections for a CRM application.
 */
export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl md:text-6xl">
                Run the Block.
                <span className="block text-neon-lime neon-glow">
                  Run the Business.
                </span>
              </h1>
              <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Street-smart CRM for pharmacy operators who understand both
                compliance and hustle. Manage inventory, customers, and
                operations with tools built by those who know the game.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button
                  size="lg"
                  className="text-lg rounded-full street-button"
                >
                  Start Your Operation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-neon-lime text-black neon-glow">
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path
                    fill="currentColor"
                    d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                  />
                </svg>
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-foreground">
                  Inventory Management
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                  Track your product, manage stock levels, and automate
                  reordering with real-time inventory visibility across all
                  locations.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-neon-cyan text-black neon-glow-cyan">
                <Database className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-foreground">
                  Customer Intelligence
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                  Know your customers better than they know themselves. Track
                  preferences, purchase history, and deliver personalized
                  experiences that build loyalty.
                </p>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-neon-pink text-white neon-glow-pink">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="mt-5">
                <h2 className="text-lg font-medium text-foreground">
                  Payment Processing
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                  Accept payments however your customers want to pay. Cash,
                  cards, digital wallets - all tracked and reconciled
                  automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Ready to dominate your market?
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
                Built for operators who understand both the street and the
                spreadsheet. Manage your business with tools that respect the
                hustle and ensure compliance.
              </p>

              {/* Legal Disclaimer */}
              <div className="legal-disclaimer mt-6">
                <p>
                  <strong>IMPORTANT LEGAL NOTICE:</strong> DeelRx CRM is
                  designed exclusively for licensed pharmaceutical operations
                  and legal dispensaries. This software is intended for lawful
                  business use only and must comply with all applicable federal,
                  state, and local regulations. Users are responsible for
                  ensuring full legal compliance in their jurisdiction.
                </p>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <Button
                size="lg"
                className="text-lg rounded-full street-button-secondary"
              >
                Request Demo
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
