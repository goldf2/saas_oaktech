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
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 5, 2026</p>

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
              OakTech sells software products including browser extensions, desktop applications,
              and developer tools. When you purchase a product, you receive a license to use that
              software under the following terms:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Personal License:</strong> For individual, non-commercial use on up to 2 devices.</li>
              <li><strong>Pro License:</strong> For professional or commercial use on up to 3 devices.</li>
              <li><strong>Team License:</strong> For up to 5 or 10 team members (depending on plan).</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              All licenses are lifetime licenses and include free updates unless otherwise stated.
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
              All prices are listed in USD and are processed securely through Creem. Prices may
              change at any time without notice. Purchases made before a price change are not
              affected. Some products may be available as one-time purchases or as part of a
              license plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Refund Policy</h2>
            <p className="text-muted-foreground">
              We offer a 30-day money-back guarantee on all products. If you are not satisfied
              with your purchase, contact us at support@oaktech.dev within 30 days of purchase
              for a full refund. Refunds are processed to the original payment method.
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
              We provide free lifetime updates for all purchased products. Support is available
              via email at support@oaktech.dev. Pro and Team license holders receive priority
              support.
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
