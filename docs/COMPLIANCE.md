# Legal and Compliance Readiness

> **Not legal advice.** This is an engineering readiness document written by
> the developer. It maps laws and standards to what the code does today and
> to what a real business would need. Applicability depends on the operator,
> markets, products and data practices. A real launch needs review by
> qualified counsel. Key privacy, accessibility, payment, consumer and software-security sources were rechecked on 12 October 2026; re-evaluate applicability when markets or features change.

**Current status:** Chronos is a public portfolio website. Products are
fictional, payments are Stripe **test mode** only, nothing is shipped and no
money moves. It does process real personal data when someone creates an
account, sends a contact message or places a test order. The detailed,
cited analysis is in
[SEARCH-SECURITY-LEGAL-REVIEW.md](SEARCH-SECURITY-LEGAL-REVIEW.md). This page
is the summary and launch checklist.

## Personal data inventory

| Data | Where it is stored | Purpose | Current retention |
|---|---|---|---|
| Account: name, email, password hash | WordPress `wp_users` / usermeta | Login, order history | Until the account is deleted |
| Sign-in token (JWT) | Visitor's browser storage | Keep the visitor signed in | Until sign-out or expiry |
| Cart selection | Visitor's browser storage | Remember the selection the visitor asked for | Until cleared |
| Test orders: items, totals, gift and delivery notes, Stripe session reference | WooCommerce order tables | Test checkout and receipts | Not yet defined |
| Contact messages: name, email, subject, message | Custom `chronos-bridge` table | Admin inbox | Not yet defined |
| Card data | **Never on Chronos systems**; entered on Stripe's hosted page | Payment | Stripe's policies |
| Network metadata (IP, user agent) | Cloudflare, hosting providers; frontend access logs disabled | Delivery and security | Provider policies |

No advertising, profiling or analytics scripts are loaded. No personal data
is sold or shared for cross-context behavioural advertising. WordPress privacy
export and erase hooks are registered by `chronos-bridge` (`Privacy/`).
**Gap:** retention periods for orders and contact messages must be defined
before real use.

## Applicability matrix

| Area | Law / standard | Status in the website | Required before real commerce |
|---|---|---|---|
| **Privacy (EU/UK)** | GDPR / UK GDPR: Arts. 5, 6, 13 (transparency), 28 (processors), 32 (security), 33 (authority notice within 72 h where required), 34 (high-risk notice to affected people without undue delay), 44–49 (transfers) | Privacy page describes the actual processing; minimal data; security controls in [THREAT-MODEL.md](THREAT-MODEL.md) | Named controller, lawful bases, retention schedule, processor agreements (hosting, CDN, Stripe), transfer mechanism, rights-request process, assessment of whether an EU representative or DPO is needed |
| **Device storage** | ePrivacy rules on terminal equipment (e.g. CNIL guidance) | Only storage strictly needed for a requested service (sign-in, cart); nothing written until the visitor acts | New assessment before adding any analytics, marketing or non-essential storage; consent banner where required |
| **Privacy (US)** | CCPA/CPRA (threshold USD 26,625,000 adjusted from 1 Jan 2025, plus other tests) and other state laws | No sale or sharing; no profiling | Business-specific applicability review per state; opt-out mechanisms if thresholds are met |
| **Children** | COPPA and local laws | Not directed at children; no children's data requested | Age policy review |
| **Payments** | **PCI DSS v4.0.1**, SAQ A | Stripe Checkout by **full redirect**: all payment fields come from Stripe. PCI SSC FAQ 1588 (Feb 2025) says the SAQ A script-attack eligibility criterion does not apply to merchants that redirect to the processor | Complete SAQ A annually with the acquirer; keep the redirect design; keep the site free of injected third-party scripts; TLS everywhere |
| **Consumer protection (EU)** | Consumer Rights Directive: pre-contract information, 14-day withdrawal; 2-year legal guarantee | Clearly labelled as a website; no real offers | Trader identity, total price, delivery, withdrawal form and process, guarantee terms, durable-medium confirmation |
| **Consumer protection (US)** | FTC Act (truthful advertising), FTC fake reviews and testimonials rule (2024), Mail, Internet or Telephone Order Merchandise Rule | No fabricated reviews; specs marked as fictional | Substantiated claims; shipping-time basis, delay notices and refunds |
| **Product safety (EU)** | General Product Safety Regulation (GPSR) plus product-specific rules (batteries, radio, chemicals, WEEE) | Not applicable to fictional products | Economic-operator roles, EU responsible person, product identification and warnings in online listings |
| **Accessibility** | European Accessibility Act (applies from 28 June 2025 to covered e-commerce services); ADA Title III (US DOJ guidance); WCAG 2.2 AA as the technical target | Keyboard support, labels, skip link, reduced motion, text alternatives; 6 automated axe scans with 0 violations | Manual WCAG 2.2 AA audit with screen readers; accessibility statement; check for a microenterprise exemption |
| **AI-generated media** | EU AI Act Art. 50 transparency; US Copyright Office guidance on AI-generated works | Campaign images and films are disclosed as AI-generated illustrations | Rights and provenance review before commercial reuse |
| **Email marketing** | CAN-SPAM, ePrivacy/PECR consent rules | No marketing email. The storefront contact form (REST) sends no email; the optional GraphQL `submitChronosContact` mutation emails the site admin by default (setting in wp-admin) | Consent records, unsubscribe, sender identity |
| **Cybersecurity of software products (EU)** | Cyber Resilience Act (CRA): manufacturer reporting of actively exploited vulnerabilities and severe incidents from **11 Sep 2026** (24 h early warning / 72 h notification); open-source steward reporting from **11 Dec 2027** | Free, non-commercial open-source code is generally outside CRA scope. Chronos has a vulnerability disclosure policy ([SECURITY.md](../SECURITY.md)) | Assess whether the offering is a covered product with digital elements and whether the operator is a manufacturer, importer, distributor or open-source steward; determine the applicable vulnerability, update and reporting duties |
| **Tax** | EU VAT (OSS), US sales-tax nexus, customs duties | No sales | Registration and tax configuration per market |
| **Open-source licensing** | MIT, GPL-2.0-or-later, GPL-3.0 | See [Licensing](#open-source-licensing) | Keep notices when redistributing |

## Security obligations mapped to controls

| Obligation | Control |
|---|---|
| Security of processing (GDPR Art. 32) | Server-side authorisation on every route, sanitisation, CSP/HSTS, least-privilege container, secrets outside source, dependency audits, CodeQL |
| Breach detection and notification (GDPR Arts. 33–34; US state breach laws) | Incident process in [AVAILABILITY-AND-DR.md](AVAILABILITY-AND-DR.md#incident-response); a defined notification decision step |
| Vulnerability handling (CRA-style good practice) | [SECURITY.md](../SECURITY.md) with GitHub private vulnerability reporting, response targets, credit policy |
| Payment data scope (PCI DSS) | Hosted redirect; no card data touches Chronos; checkout redirects only to `https://checkout.stripe.com` |

## Open-source licensing

| Path | License |
|---|---|
| Repository root: React frontend, scripts, configuration, docs | MIT ([LICENSE](../LICENSE)) |
| `wordpress/wp-content/plugins/chronos-bridge/` | GPL-2.0-or-later ([LICENSE](../wordpress/wp-content/plugins/chronos-bridge/LICENSE)) |
| `wordpress/wp-content/plugins/chronos-blocks/` | GPL-2.0-or-later ([LICENSE](../wordpress/wp-content/plugins/chronos-blocks/LICENSE)) |
| `wordpress/wp-content/plugins/wp-graphql-cors-master/` | GPL-3.0, third-party by its original authors ([LICENSE](../wordpress/wp-content/plugins/wp-graphql-cors-master/LICENSE)) |
| npm and Composer dependencies | Their own licenses, installed from registries and not stored in this repository |

The WordPress plugins are GPL because they run inside WordPress, which is
GPL-licensed. MIT code can be combined with GPL code. See
[THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md).

## Sources

- GDPR: [Regulation (EU) 2016/679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)
- CPPA: [Adjusted monetary thresholds](https://cppa.ca.gov/regulations/cpi_adjustment.html)
- PCI SSC: [FAQ clarifies new SAQ A eligibility criteria](https://blog.pcisecuritystandards.org/faq-clarifies-new-saq-a-eligibility-criteria-for-e-commerce-merchants) (28 Feb 2025)
- European Commission: [CRA reporting obligations](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting)
- Council of the EU: [Accessibility of products and services](https://www.consilium.europa.eu/en/policies/accessibility-goods-services/)
- US DOJ: [Guidance on web accessibility and the ADA](https://www.ada.gov/resources/web-guidance/)
- FTC: [Fake reviews and testimonials rule](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials), [Mail Order Rule guide](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule)
- EU: [Distance selling](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm), [Consumer guarantees](https://europa.eu/youreurope/business/selling-in-eu/consumer-contracts-guarantees/consumer-guarantees/index_en.htm), [GPSR summary](https://eur-lex.europa.eu/EN/legal-content/summary/general-product-safety-regulation-2023.html)
- European Commission: [AI Act Article 50 transparency](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act)

Full citations and reasoning: [SEARCH-SECURITY-LEGAL-REVIEW.md](SEARCH-SECURITY-LEGAL-REVIEW.md).

## Governance decisions before enabling commerce or advertising

Maintain a market/feature register with the operator's legal identity, target countries, products, processing purposes, lawful bases, processors, international transfers, retention, consumer obligations, taxes and accountable reviewer. The business owner approves product specifications, provenance, media/IP rights, price/tax/shipping disclosures, returns, warranty and complaint handling before real offers are enabled. Product-safety obligations depend on the actual watch, components and economic-operator role.

For EU/UK personal-data incidents, record awareness time and risk assessment. GDPR Article 33 concerns supervisory-authority notice, generally within 72 hours where required; Article 34 concerns high-risk communication to affected people without undue delay. These are separate decisions. Follow local breach laws and processor contractual duties for other markets. Keep evidence privately and obtain qualified advice when deciding applicability.

## Additional data and retention boundaries

| Component | Data / purpose | Required handling |
|---|---|---|
| Advertising integration | Account/campaign identifiers, performance reports, proposals, approvals, provider token | Least-privilege owner access; local private state; provider/Claude-host terms and retention review before sending business data |
| Inventory service | Published product/gallery data, batch results and private listing drafts | Bounded intake, allowlisted image origins, no image downloading, freshness reconciliation, private state backup/retention |
| n8n | Encrypted credentials, workflow configuration and execution records | Retain encryption key separately; configure execution pruning; n8n pruning does not prune inventory batch history |
| Support and security evidence | Incident records, access/change history, rights-request evidence | Purpose-limited access, redaction for public reports, documented deletion/hold decisions |

The storefront has no installed Meta Pixel or marketing analytics script. Connecting an owner advertising account does not itself add browser tracking. Adding remarketing, custom audiences, customer uploads, profiling, email marketing or new analytics requires a fresh privacy/consent/platform assessment before activation. A Claude host has its own provider/data settings; the MCP server's absence of inference calls does not determine that host's data policy.

Approve a retention schedule per data class instead of inventing a universal period. Record the legal basis, maximum duration, deletion job, backup expiry, legal holds and responsible owner. For access/erasure requests: verify identity proportionately, inventory relevant stores/processors, export or erase authorized records, document lawful exceptions, propagate deletion where required and prevent restored backups from reintroducing erased data. Contact exporter/eraser hooks assist this process; they do not complete an organization-wide privacy programme.

## Licensing, AI and platform use

n8n's [Sustainable Use License](https://docs.n8n.io/sustainable-use-license/) permits the described internal business automation; offering hosted/embedded n8n access to customers needs a separate license assessment. Retain MIT/GPL and third-party notices when redistributing project components. Record image/font/video provenance and commercial reuse rights. Review AI Act Article 50 duties by provider/deployer role and content context; AI-generated content does not create one identical disclosure obligation in every circumstance.

Meta and social marketplace adapters need valid account access, permitted use, appropriate scopes, platform-term review and owner approval. Avoid importing customer data or enabling publication until that purpose and destination are approved. Hosted Stripe redirect reduces card-data scope but does not remove applicable merchant PCI duties or the need to protect the redirecting site. Accessibility targets WCAG 2.2 AA; automated scans are only part of the required manual evaluation.

Sources: [GDPR Articles 5, 12–22, 28, 32–34 and 44–49](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679), [PCI SSC hosted-redirect scope](https://www.pcisecuritystandards.org/faqs/1439/), [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/), [CRA reporting](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting). This register supplies engineering decisions for qualified legal review; it is not a compliance certification.
