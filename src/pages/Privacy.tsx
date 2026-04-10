import Layout from '@/components/Layout';
import SEOHead from '@/components/SEOHead';

const Privacy = () => {
  return (
    <Layout>
      <SEOHead title="Privacy Policy" description="Chronos privacy policy — how we collect, use, and protect your personal data." />

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl prose prose-invert prose-sm">
          <h1 className="font-display text-4xl mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-8">Last updated: April 10, 2026</p>

          <h2 className="font-display text-2xl mt-10 mb-4">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            When you use Chronos, we may collect the following personal data:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li><strong className="text-foreground">Account information:</strong> Name, email address when you register or log in.</li>
            <li><strong className="text-foreground">Order information:</strong> Billing address, shipping address, and payment details processed securely through Stripe.</li>
            <li><strong className="text-foreground">Contact form submissions:</strong> Name, email, subject, message, and IP address.</li>
            <li><strong className="text-foreground">Cookies:</strong> Session tokens and consent preferences stored in your browser.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>To process and fulfill your orders.</li>
            <li>To respond to your contact form inquiries.</li>
            <li>To manage your account and authentication.</li>
            <li>To improve our website and services.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">3. Payment Security</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            All payment transactions are processed through <strong className="text-foreground">Stripe</strong>. We never store your credit card number, CVV, or full payment details on our servers. Stripe is PCI DSS Level 1 certified.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">4. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use the following cookies:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li><strong className="text-foreground">Essential cookies:</strong> Authentication tokens and cart session — required for the site to function.</li>
            <li><strong className="text-foreground">Consent cookie:</strong> Remembers your cookie preference.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We do not use third-party analytics or advertising cookies. If we add them in the future, they will only load after you give explicit consent.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">5. Data Retention</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Contact form submissions are retained until manually deleted by an administrator or upon a privacy erasure request. Order data is retained as required by applicable tax and commerce laws.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">6. Your Rights (GDPR)</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            If you are in the EU/EEA, you have the right to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li>Access your personal data.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Withdraw consent at any time.</li>
            <li>Export your data in a portable format.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mb-6">
            To exercise these rights, contact us at <a href="mailto:concierge@chronos.com" className="text-primary hover:underline">concierge@chronos.com</a>.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">7. Third-Party Services</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
            <li><strong className="text-foreground">Stripe:</strong> Payment processing — <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
            <li><strong className="text-foreground">Unsplash:</strong> Stock photography for placeholder images — <a href="https://unsplash.com/license" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Unsplash License</a></li>
          </ul>

          <h2 className="font-display text-2xl mt-10 mb-4">8. Changes to This Policy</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            We may update this policy from time to time. Changes will be posted on this page with an updated date.
          </p>

          <h2 className="font-display text-2xl mt-10 mb-4">9. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy-related questions, email <a href="mailto:concierge@chronos.com" className="text-primary hover:underline">concierge@chronos.com</a>.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
