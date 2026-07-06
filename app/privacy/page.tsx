import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy - OakTech",
  description: "Privacy Policy for OakTech software tools store.",
};

export default function PrivacyPage() {
  return (
    <div className="container px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 5, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
            <p className="text-muted-foreground">
              OakTech (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is
              committed to protecting your personal data. This Privacy Policy explains how we
              collect, use, and safeguard your information when you visit our website or
              purchase our software products.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">We may collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Account information:</strong> Email address and password (encrypted) when you create an account.</li>
              <li><strong>Purchase information:</strong> Product purchased, license key, and transaction ID.</li>
              <li><strong>Payment information:</strong> Processed securely by our payment provider (Creem). We do not store your card details.</li>
              <li><strong>Usage data:</strong> IP address, browser type, and pages visited for analytics purposes.</li>
              <li><strong>Support communications:</strong> Emails and messages sent to our support team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-2">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Process and fulfill your software purchases and deliver license keys.</li>
              <li>Provide customer support and respond to your inquiries.</li>
              <li>Send important updates about your purchased products.</li>
              <li>Improve our products, services, and website.</li>
              <li>Detect and prevent fraud or abuse of our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal data. We may share information with trusted
              third-party service providers who help us operate our business:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Creem:</strong> Payment processing and checkout.</li>
              <li><strong>Supabase:</strong> Authentication and database hosting.</li>
              <li><strong>Email providers:</strong> Transactional and support emails.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We may also disclose information when required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your
              data, including encryption, secure servers, and access controls. However, no
              method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Your Rights</h2>
            <p className="text-muted-foreground mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt out of marketing communications.</li>
              <li>Export your account data.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              To exercise these rights, contact us at support@oaktech.dev.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and session management. We may also
              use analytics cookies to understand how visitors use our website. You can control
              cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not directed to individuals under 16. We do not knowingly collect
              personal data from children. If you believe we have collected data from a minor,
              please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting the new policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: <Link href="mailto:support@oaktech.dev" className="text-primary hover:underline">support@oaktech.dev</Link>
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
