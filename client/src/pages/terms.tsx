import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using CRM Launch ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              CRM Launch is a cloud-based Customer Relationship Management (CRM) software service designed for UK small businesses. The Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Invoice generation and management</li>
              <li>Quotation creation and tracking</li>
              <li>Delivery challan management</li>
              <li>Inventory management</li>
              <li>HR and employee management</li>
              <li>Sales reporting and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Free Trial</h2>
            <p className="text-muted-foreground mb-4">
              We offer a 7-day free trial period. During the trial:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>No credit card is required to start the trial</li>
              <li>You have full access to all features</li>
              <li>You can cancel at any time during the trial without charge</li>
              <li>If you do not cancel before the trial ends, your subscription will automatically begin</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="text-muted-foreground mb-4">
              After the free trial period, the Service is available on a monthly subscription basis at £20/month. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Pay the monthly subscription fee in advance</li>
              <li>Payments are processed securely through Stripe or PayPal</li>
              <li>Your subscription will automatically renew each month unless cancelled</li>
              <li>All fees are non-refundable except as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cancellation</h2>
            <p className="text-muted-foreground">
              You may cancel your subscription at any time through your account settings. Upon cancellation, you will continue to have access to the Service until the end of your current billing period. No refunds will be provided for the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy of information you provide</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service to store or transmit infringing, libelous, or otherwise unlawful material</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The Service and its original content, features, and functionality are owned by CRM Launch and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              You retain ownership of all data you create using the Service. By using the Service, you grant us a license to store, process, and display your data solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Data and Privacy</h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Service Availability</h2>
            <p className="text-muted-foreground mb-4">
              We strive to provide reliable service but do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4 ml-4">
              <li>Uninterrupted or error-free service</li>
              <li>That defects will be corrected</li>
              <li>That the Service will meet your specific requirements</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, CRM Launch shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold harmless CRM Launch, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:
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

