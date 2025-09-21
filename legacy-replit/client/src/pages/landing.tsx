import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/branding/BrandMark";
import { BRAND } from "@/branding/branding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Check, 
  Mail, 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Package, 
  CreditCard,
  Truck,
  Heart,
  Settings,
  ArrowRight,
  Star
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLearnMore = () => {
    const featuresSection = document.getElementById("features-section");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const coreFeatures = [
    {
      name: "Secure by Design",
      icon: Shield,
      description: "AES-256 encryption protects every customer record"
    },
    {
      name: "Modern Interface",
      icon: BarChart3,
      description: "Futurist dashboard powered by shadcn/ui"
    },
    {
      name: "AI Workflow Assistant",
      icon: Zap,
      description: "Automates CRM tasks, reporting, insights"
    },
    {
      name: "Scalable Cloud",
      icon: Package,
      description: "Vercel + Supabase backend infrastructure"
    },
    {
      name: "Custom Modules",
      icon: Settings,
      description: "Tailored fields and pipelines for your business"
    },
    {
      name: "Compliance Ready",
      icon: Users,
      description: "HIPAA/GDPR-style frameworks built-in"
    }
  ];

  const valueProps = [
    {
      icon: Shield,
      title: "Encrypted Customer Data",
      description: "AES-256 encryption for complete data protection"
    },
    {
      icon: Zap,
      title: "Futuristic Dashboard UI",
      description: "Clean, responsive, accessible design system"
    },
    {
      icon: Settings,
      title: "AI-Assisted Automation",
      description: "Seamless deployment on Vercel + Supabase"
    }
  ];

  const testimonials = [
    {
      text: "DealRxCRM transformed our customer management. The futuristic interface and AI features are game-changing.",
      author: "Sarah Chen",
      role: "Operations Director",
      rating: 5
    },
    {
      text: "The encryption and compliance features give our team complete confidence in data security.",
      author: "Marcus Rodriguez",
      role: "CEO, TechFlow Solutions",
      rating: 5
    },
    {
      text: "Finally, a CRM that feels like the future. Clean, fast, and incredibly powerful.",
      author: "Lisa Thompson",
      role: "Head of Sales",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      description: "Core CRM features for small teams",
      features: [
        "Up to 1,000 contacts",
        "Basic encryption",
        "Standard support",
        "Core dashboard"
      ],
      cta: "Start Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$99",
      period: "per month",
      description: "Full encryption, AI workflows, unlimited pipelines",
      features: [
        "Unlimited contacts",
        "AES-256 encryption",
        "AI workflow assistant",
        "Custom modules",
        "Priority support"
      ],
      cta: "Get Started",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Custom integrations, advanced compliance, dedicated support",
      features: [
        "Custom integrations",
        "Advanced compliance",
        "Dedicated support",
        "Custom deployment",
        "SLA guarantees"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden radial-grid">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-400/5" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/90 to-background/80" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium glass">
                🚀 Next-Generation CRM Platform
              </Badge>
            </div>


            {/* Title & Subtitle */}
            <div className="space-y-6 max-w-4xl mx-auto glass-strong rounded-xl p-8 neon-glow">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                <span className="urban-text-glow">Experience the Future</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-purple-500">
                  of CRM
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {BRAND.tagline}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 glass neon-glow"
                data-testid="button-login"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleLearnMore}
                className="px-8 py-4 text-lg font-semibold border-2 hover:bg-accent"
                data-testid="button-learn-more"
              >
                Request Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="pt-12">
              <p className="text-sm text-muted-foreground mb-4">Trusted by Forward-Thinking Teams</p>
              <div className="flex justify-center items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium">5.0 • 1000+ Users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <section className="py-20 bg-gradient-to-br from-background via-muted/40 to-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16 glass-strong rounded-xl p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for business. Secured for the future.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 glass urban-card hover:neon-glow">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Modules Section */}
      <section id="features-section" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16 glass-strong rounded-xl p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Complete CRM Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern customer management
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((module, index) => {
              const Icon = module.icon;
              return (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 glass urban-card hover:neon-glow border-primary/20"
                  data-testid={`module-${module.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-muted/20 via-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16 glass-strong rounded-xl p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Trusted by Forward-Thinking Teams
            </h2>
            <p className="text-xl text-muted-foreground">
              Real feedback from businesses using DealRxCRM
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 glass urban-card hover:neon-glow border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16 glass-strong rounded-xl p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scale your CRM with plans designed for every business size
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`group hover:shadow-xl transition-all duration-300 glass urban-card hover:neon-glow border-primary/20 ${
                  plan.highlighted ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary mt-4">
                    {plan.price}
                    <span className="text-sm text-muted-foreground font-normal">
                      /{plan.period}
                    </span>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-6 ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' 
                        : ''
                    }`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-cyan-400/10 to-purple-500/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-8 glass rounded-xl p-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Experience the Future of CRM
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get your future CRM platform today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 glass neon-glow"
                data-testid="button-cta-login"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
                onClick={() => window.location.href = `mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@dealrxcrm.com'}`}
                data-testid="button-contact"
              >
                <Mail className="mr-2 w-5 h-5" />
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">DealRxCRM</h4>
              <p className="text-sm text-muted-foreground">
                Next-generation CRM platform with futuristic design, AI workflows, and enterprise security.
              </p>
            </div>
            
            {/* Product */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features-section" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
              </ul>
            </div>
            
            {/* Security */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Security</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>AES-256 Encryption</li>
                <li>HIPAA/GDPR Compliance</li>
                <li>AI-Assisted Workflows</li>
                <li>Cloud-First Architecture</li>
              </ul>
            </div>
            
            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@dealrxcrm.com'}`} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-support"
                  >
                    {import.meta.env.VITE_SUPPORT_EMAIL || 'support@dealrxcrm.com'}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">
                  <a href="/legal" className="hover:text-foreground transition-colors">Legal Terms</a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="pt-8 border-t border-border/30 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              © 2025 {BRAND.name} by Wrelik Brands, LLC. {BRAND.name} must not be used for any illegal drug or controlled substance activity. Users are responsible for operating in compliance with all applicable laws.
            </p>
            <p className="text-xs text-muted-foreground">
              Full terms: <a href="/legal" className="hover:text-foreground transition-colors underline">dealrxcrm.com/legal</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}