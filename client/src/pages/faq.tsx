import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";

export default function FAQ() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I start using CRM Launch?",
          a: "Simply click 'Start Free Trial' on our homepage. No credit card required. You'll have 7 days to explore all features and create unlimited invoices, quotations, and manage your business data."
        },
        {
          q: "Do I need a credit card for the free trial?",
          a: "No, you don't need a credit card to start your 7-day free trial. You can explore all features risk-free. We'll only ask for payment information if you decide to continue after the trial period."
        },
        {
          q: "How long does the free trial last?",
          a: "The free trial lasts for 7 days. During this time, you have full access to all features including invoice generation, quotation creation, inventory management, HR module, and sales reports."
        },
        {
          q: "What happens after my trial ends?",
          a: "If you don't cancel before your trial ends, your subscription will automatically begin at £20/month. You can cancel at any time through your account settings with no cancellation fees."
        }
      ]
    },
    {
      category: "Pricing & Payments",
      questions: [
        {
          q: "How much does CRM Launch cost?",
          a: "CRM Launch costs just £20/month after your 7-day free trial. This includes all features - invoices, quotations, delivery challans, inventory management, HR module, and sales reports. No hidden fees."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept payments via Stripe (credit and debit cards) and PayPal. All payments are processed securely through these trusted payment processors."
        },
        {
          q: "Can I cancel my subscription anytime?",
          a: "Yes, you can cancel your subscription at any time through your account settings. There are no long-term contracts or cancellation fees. You'll continue to have access until the end of your current billing period."
        },
        {
          q: "Do you offer refunds?",
          a: "Subscription fees are non-refundable except as required by UK law. However, you can cancel at any time and won't be charged for future billing periods."
        },
        {
          q: "Is there a setup fee?",
          a: "No, there are no setup fees. Just £20/month with a 7-day free trial to get started."
        }
      ]
    },
    {
      category: "Features & Functionality",
      questions: [
        {
          q: "What features are included?",
          a: "CRM Launch includes: Professional invoice generation with UK VAT support, quotation creation, delivery challan management, inventory tracking, HR/employee management, sales reports and analytics, custom business branding, PDF and Word document downloads, and secure payment processing."
        },
        {
          q: "Can I customize my invoices and quotations?",
          a: "Yes! You can add your business logo, choose your primary brand color, customize header and footer text, and include your business details. All documents are generated with your branding."
        },
        {
          q: "Does it support UK VAT?",
          a: "Yes, CRM Launch is built specifically for UK businesses with built-in support for UK VAT (20% default, customizable), UK address formats, and UK business practices."
        },
        {
          q: "Can I download my documents?",
          a: "Yes, you can download invoices, quotations, and delivery challans in both PDF and Word formats. You can also choose to include or exclude headers and footers."
        },
        {
          q: "Is there a mobile app?",
          a: "Currently, CRM Launch is a web-based application that works on all devices through your browser. A mobile app may be available in the future."
        }
      ]
    },
    {
      category: "Data & Security",
      questions: [
        {
          q: "Is my data secure?",
          a: "Absolutely. We use industry-standard encryption (SSL/TLS) for data in transit and encryption at rest. All data is stored securely in our database with regular backups. We follow UK GDPR compliance standards."
        },
        {
          q: "Where is my data stored?",
          a: "Your data is stored securely in our database hosted on Neon (a PostgreSQL-compatible database service). All data is encrypted and backed up regularly."
        },
        {
          q: "Can I export my data?",
          a: "Yes, you can export your data at any time. Contact us at help@crmlaunch.co.uk if you need assistance with data export."
        },
        {
          q: "What happens to my data if I cancel?",
          a: "Your data will be retained for a reasonable period after cancellation to comply with legal obligations. You can request deletion of your data by contacting us at help@crmlaunch.co.uk."
        },
        {
          q: "Do you share my data with third parties?",
          a: "We only share data with trusted third-party service providers necessary to provide the Service (payment processors, database hosting). We never sell your data. See our Privacy Policy for details."
        }
      ]
    },
    {
      category: "Support & Help",
      questions: [
        {
          q: "How can I get help?",
          a: "You can contact our support team at help@crmlaunch.co.uk. We typically respond within 24 hours. You can also visit our Contact page for more information."
        },
        {
          q: "What are your support hours?",
          a: "Email support is available 24/7. We typically respond within 24 hours during business hours (Monday-Friday, 9 AM - 5 PM GMT)."
        },
        {
          q: "Do you offer training?",
          a: "Our platform is designed to be intuitive and easy to use. If you need assistance, our support team is happy to help. We're also working on video tutorials and documentation."
        },
        {
          q: "Can I request new features?",
          a: "Yes! We welcome feature requests. Please email us at help@crmlaunch.co.uk with your suggestions. We regularly update the platform based on user feedback."
        }
      ]
    },
    {
      category: "Technical",
      questions: [
        {
          q: "What browsers are supported?",
          a: "CRM Launch works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser for the best experience."
        },
        {
          q: "Do I need to install anything?",
          a: "No, CRM Launch is a cloud-based service. You just need a web browser and an internet connection. No software installation required."
        },
        {
          q: "Is there an API?",
          a: "Currently, CRM Launch does not have a public API. If you need API access, please contact us at help@crmlaunch.co.uk to discuss your requirements."
        },
        {
          q: "What if the service is down?",
          a: "We strive for 99.9% uptime. In the rare event of downtime, we work quickly to restore service. You can check our status page or contact support for updates."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about CRM Launch
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, index) => (
                  <Card key={index} className="p-6">
                    <h3 className="font-semibold mb-2 text-lg">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <Card className="p-8 mt-12 bg-primary text-primary-foreground text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="mb-6 opacity-90">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">
                Contact Support
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/login?signup=true">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

