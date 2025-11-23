import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              CRM Launch ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our CRM software service.
            </p>
            <p className="text-muted-foreground">
              By using our service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
            <p className="text-muted-foreground mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Business information (business name, address, VAT number, company number)</li>
              <li>Payment information (processed securely through Stripe and PayPal)</li>
              <li>Account credentials (email and password)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.2 Business Data</h3>
            <p className="text-muted-foreground mb-4">
              We store the business data you create using our service, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Invoices, quotations, and delivery challans</li>
              <li>Customer information</li>
              <li>Inventory items</li>
              <li>Employee records</li>
              <li>Sales reports and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2">2.3 Usage Data</h3>
            <p className="text-muted-foreground">
              We may collect information about how you access and use our service, including IP address, browser type, device information, and usage patterns.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Provide, maintain, and improve our CRM service</li>
              <li>Process your transactions and manage your subscription</li>
              <li>Send you service-related communications</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information and business data. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and updates</li>
              <li>Secure payment processing through Stripe and PayPal</li>
            </ul>
            <p className="text-muted-foreground">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information and business data for as long as your account is active or as needed to provide you services. If you cancel your account, we will retain your data for a reasonable period to comply with legal obligations and resolve disputes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Under UK GDPR, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Access your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise these rights, please contact us at <a href="mailto:help@crmlaunch.co.uk" className="text-primary hover:underline">help@crmlaunch.co.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We use third-party services to provide our service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li><strong>Stripe:</strong> Payment processing - <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
              <li><strong>PayPal:</strong> Payment processing - <a href="https://www.paypal.com/uk/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
              <li><strong>Neon Database:</strong> Data storage - <a href="https://neon.tech/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to maintain your session and improve your experience. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: <a href="mailto:help@crmlaunch.co.uk" className="text-primary hover:underline">help@crmlaunch.co.uk</a>
            </p>
            <p className="text-muted-foreground">
              Website: <Link href="/contact" className="text-primary hover:underline">crmlaunch.co.uk/contact</Link>
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}

