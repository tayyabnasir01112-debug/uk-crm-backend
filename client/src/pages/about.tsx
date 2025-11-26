import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileCheck, TruckIcon, Package, Users, BarChart3, Check, ArrowLeft, Home, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SeoHead } from "@/components/seo-head";

export default function About() {
  const features = [
    {
      icon: FileText,
      title: "Professional Quotations",
      description: "Create branded quotations with automatic calculations and UK VAT support."
    },
    {
      icon: FileCheck,
      title: "Smart Invoicing",
      description: "Generate professional invoices, track payments, and manage due dates."
    },
    {
      icon: TruckIcon,
      title: "Delivery Challans",
      description: "Create delivery documents with product details and customer information."
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels, manage products, and monitor inventory in real-time."
    },
    {
      icon: Users,
      title: "HR Module",
      description: "Manage employee records, track salaries, and maintain personnel data."
    },
    {
      icon: BarChart3,
      title: "Sales Reports",
      description: "Visual insights into your business performance with charts and analytics."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="About CRM Launch | Built for UK Small Businesses"
        description="Learn how CRM Launch helps UK small businesses manage quotations, invoices, inventory, HR, and delivery challans in one affordable CRM."
        canonicalPath="/about"
      />

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Button variant="ghost" className="px-0 text-primary hover:text-primary" asChild>
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold mb-6">About CRM Launch</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Empowering UK small businesses with affordable, professional CRM software designed specifically for the UK market.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground mb-4">
              At CRM Launch, we believe that every UK small business deserves access to professional business management tools without the enterprise price tag. We've built a comprehensive CRM solution that combines invoice management, quotation generation, delivery tracking, inventory control, HR management, and sales reporting - all in one affordable platform.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              Our platform is specifically designed for UK businesses, with built-in support for UK VAT (20%), UK address formats, and UK business practices. We understand the unique needs of small businesses in the UK and have created a solution that grows with you.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete Business Management</h2>
            <p className="text-xl text-muted-foreground">
              Six powerful modules working together to streamline your operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Why Choose CRM Launch?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">UK-Focused Design</h3>
                  <p className="text-muted-foreground">Built specifically for UK small businesses with UK VAT support, address formats, and business practices.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Affordable Pricing</h3>
                  <p className="text-muted-foreground">Just £20/month with a 7-day free trial. No hidden fees, no credit card required for trial.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Secure Payments</h3>
                  <p className="text-muted-foreground">All payments processed securely via Stripe and PayPal. Your data is safe and encrypted.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary shrink-foreground shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Professional Documents</h3>
                  <p className="text-muted-foreground">Generate branded invoices, quotations, and delivery challans with your business logo and colors.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">All-in-One Solution</h3>
                  <p className="text-muted-foreground">Manage invoices, inventory, employees, and sales reports from one integrated platform.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join UK small businesses using CRM Launch to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login?signup=true">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

