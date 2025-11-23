import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Package, 
  Users, 
  BarChart3, 
  FileCheck, 
  TruckIcon,
  Check,
  ArrowRight
} from "lucide-react";
import heroImage from "@assets/generated_images/office_workspace_hero_background.png";
import dashboardImage from "@assets/generated_images/crm_dashboard_mockup.png";
import invoiceImage from "@assets/generated_images/invoice_template_preview.png";
import inventoryImage from "@assets/generated_images/inventory_management_illustration.png";

export default function Landing() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

  // Preload hero image
  useEffect(() => {
    const img = new Image();
    img.src = heroImage;
    img.onload = () => setHeroLoaded(true);
  }, []);

  const features = [
    {
      icon: FileText,
      title: "Professional Quotations",
      description: "Create beautiful, branded quotations in minutes with customizable templates and automatic calculations."
    },
    {
      icon: FileCheck,
      title: "Smart Invoicing",
      description: "Generate invoices with your branding, track payments, and manage due dates effortlessly."
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
      description: "Manage employee records, track salaries, and maintain personnel data in one place."
    },
    {
      icon: BarChart3,
      title: "Sales Reports",
      description: "Visual insights into your business performance with charts and analytics."
    }
  ];

  const benefits = [
    {
      title: "Save Time & Effort",
      description: "Auto-generate professional documents with your branding. No more manual formatting or design work.",
      image: invoiceImage
    },
    {
      title: "Look Professional",
      description: "Custom logos, signatures, and headers make your business stand out. We'll even help you create them.",
      image: dashboardImage
    },
    {
      title: "Stay Organized",
      description: "All your business data in one place. Invoices, inventory, employees - everything connected.",
      image: inventoryImage
    }
  ];

  const pricingFeatures = [
    "Unlimited quotations & invoices",
    "Full inventory management",
    "HR employee records",
    "Sales reporting & analytics",
    "Custom business branding",
    "Auto-generated designs",
    "PDF downloads",
    "Email support"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Hero Background with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 z-10" />
          {!heroLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse" />
          )}
          <img 
            src={heroImage} 
            alt="Professional workspace" 
            className={`w-full h-full object-cover transition-opacity duration-500 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onLoad={() => setHeroLoaded(true)}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-20 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/20 text-primary-foreground border-primary/40" data-testid="badge-trial">
              7-Day Free Trial • No Credit Card Required
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              UK Small Business CRM Software
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
              Professional Invoice Management, Quotations, Delivery Challans, Inventory & HR<br />
              <span className="text-2xl sm:text-3xl font-semibold text-white">Just £20/month • Secure Payments via Stripe & PayPal</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 min-h-14"
                onClick={() => window.location.href = "/login?signup=true"}
                data-testid="button-start-trial"
              >
                Start 7-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 min-h-14 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                onClick={() => window.location.href = "/login"}
                data-testid="button-login"
              >
                Login
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 min-h-14 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
            
            <p className="text-white/80 text-sm">
              ✓ No credit card required • ✓ Cancel anytime • ✓ UK-focused features
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Complete UK Business Management Solution</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Six powerful modules designed specifically for UK small businesses - from invoice generation to HR management, all in one integrated platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 hover-elevate border-card-border"
                data-testid={`card-feature-${index}`}
              >
                <div className="flex flex-col h-full">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 last:mb-0 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">{benefit.title}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="rounded-lg overflow-hidden border border-card-border relative bg-muted">
                  {!imagesLoaded[index] && (
                    <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img 
                    src={benefit.image} 
                    alt={benefit.title}
                    className={`w-full h-auto transition-opacity duration-300 ${imagesLoaded[index] ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onLoad={() => setImagesLoaded(prev => ({ ...prev, [index]: true }))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing for UK Businesses</h2>
            <p className="text-xl text-muted-foreground">
              One affordable plan with everything you need • Secure payments via Stripe & PayPal
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="p-8 border-2 border-primary">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Complete CRM</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold">£20</span>
                  <span className="text-muted-foreground text-xl">/month</span>
                </div>
                <Badge className="bg-primary/20 text-primary" data-testid="badge-trial-pricing">
                  First 7 days FREE
                </Badge>
              </div>

              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3" data-testid={`feature-${index}`}>
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full text-lg py-6 min-h-14" 
                size="lg"
                onClick={() => window.location.href = "/login?signup=true"}
                data-testid="button-pricing-cta"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-card-border">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              &copy; {new Date().getFullYear()} CRM Launch. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Designed for UK small businesses • Secure payments via Stripe & PayPal
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a 
                href="https://tayyabautomates.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Tayyab Automates LTD
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
