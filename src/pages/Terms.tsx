import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';

const Terms = () => {
  return (
    <Layout>
      <SEOHead title="Terms of Service" description="Chronos terms of service — rules and conditions for using our website and purchasing products." />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl prose prose-invert prose-sm">
          <h1 className="font-display text-4xl mb-8">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: April 10, 2026</p>

          <h2 className="font-display text-2xl mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            By accessing or using Chronos ("the Site"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Site.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">2. Products and Pricing</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>All prices are listed in USD and are subject to change without notice.</li>
            <li>Product images are for illustration purposes. Actual products may vary slightly.</li>
            <li>We reserve the right to limit quantities or refuse any order.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">3. Orders and Payment</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>Placing an order constitutes an offer to purchase. We may accept or decline at our discretion.</li>
            <li>Payment is processed securely through Stripe. We do not store your payment card details.</li>
            <li>Cash on Delivery is available for select regions.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">4. Shipping and Delivery</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Shipping times and costs vary by destination. We are not liable for delays caused by carriers, customs, or force majeure events.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">5. Returns and Refunds</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>Returns are accepted within 14 days of delivery for unused items in original packaging.</li>
            <li>Refunds will be processed to the original payment method within 7 business days of receiving the returned item.</li>
            <li>Custom or engraved items are non-returnable.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">6. User Accounts</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">7. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            All content on the Site — including text, images, logos, and code — is owned by Chronos or its licensors and protected by copyright law. You may not reproduce, distribute, or create derivative works without written permission.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">8. Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            To the maximum extent permitted by law, Chronos shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Site or purchase of products.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">9. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We may update these terms at any time. Continued use of the Site after changes constitutes acceptance of the updated terms.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">10. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these terms, email <a href="mailto:concierge@chronos.com" className="text-primary hover:underline">concierge@chronos.com</a>.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;
