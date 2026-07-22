import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service - OakTech",
  description: "Terms of Service for OakTech software tools store.",
};

export default function TermsPage() {
  return (
    <div className="container px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 23, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using OakTech&apos;s website and software products, you agree to be
              bound by these Terms of Service. If you do not agree with any part of these terms,
              please do not purchase or use our products.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Products and Licenses</h2>
            <p className="text-muted-foreground mb-2">
              OakTech offers software products including browser extensions, desktop applications,
              and developer tools. License scope, supported platforms, permitted use, and any
              device or seat limits are shown on the applicable product and checkout pages.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Beta access:</strong> May be provided directly for evaluation and can change as the product develops.</li>
              <li><strong>Paid licenses:</strong> Apply only when a product is released for purchase and the displayed checkout terms are accepted.</li>
              <li><strong>Team use:</strong> Requires a product-specific team license when one is offered.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Product pages state whether a product is in beta, available for purchase, or planned.
              We do not grant a commercial license merely by making a beta build available.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Acceptable Use</h2>
            <p className="text-muted-foreground mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Reverse engineer, decompile, or disassemble our software.</li>
              <li>Redistribute, resell, or sublicense our products without permission.</li>
              <li>Use our products for any illegal or unauthorized purpose.</li>
              <li>Remove or alter any copyright or proprietary notices.</li>
              <li>Share license keys with individuals outside your licensed team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Payment and Pricing</h2>
            <p className="text-muted-foreground">
              Prices and payment terms are shown only for products that are available for purchase
              and are processed securely through Creem. A product marked Beta or Coming soon is
              not an offer for paid checkout. Price, tax, and license terms shown at checkout apply
              to the relevant purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Refund Policy</h2>
            <p className="text-muted-foreground">
              Refund eligibility, when offered, is stated on the applicable product or checkout
              page. Beta access does not involve a paid purchase. For purchase questions, contact
              support@oaktech.dev with your order details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All OakTech software, branding, and content are the intellectual property of OakTech.
              You are granted a limited, non-exclusive, non-transferable license to use the
              software as described in these terms. All rights not expressly granted are reserved.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              Our software is provided &quot;as is&quot; without warranties of any kind, either express
              or implied. We do not guarantee that the software will be error-free or uninterrupted.
              We are not liable for any data loss or damage resulting from the use of our products.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              OakTech shall not be liable for any indirect, incidental, special, or consequential
              damages arising from the use of our products. Our total liability shall not exceed
              the amount paid for the product in question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Updates and Support</h2>
            <p className="text-muted-foreground">
              Update availability and support terms vary by product and release status. Beta builds
              may change, pause, or be replaced as development continues. Support is available via
              email at support@oaktech.dev.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">10. Account Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your account and revoke licenses if
              you violate these Terms of Service. Upon termination, you must delete all copies
              of our software from your devices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms of Service at any time. Continued use of our products
              after changes constitutes acceptance of the new terms. We will notify users of
              significant changes via email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms of Service, please contact us at:
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
