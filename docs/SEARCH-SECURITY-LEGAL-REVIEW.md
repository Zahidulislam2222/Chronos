# Chronos Search, Security and Legal Readiness

## Scope and conclusion

Chronos is a public portfolio demonstration of a watch storefront, not a retailer. Its products are fictional, its prices and specifications are illustrative, and the connected demo supports accounts, stored contact messages, demonstration orders and Stripe test payments only. This distinction determines what can responsibly be implemented now. The current connected privacy notice explains CMS account/contact/order data and test payment processing. This review does not certify commercial sale of real goods.

The appropriate immediate work is to make the portfolio discoverable and understandable, reduce the exposed application surface, explain actual browser and infrastructure processing, provide accessible alternatives to motion, and document the evidence needed before commercial launch. Applying every US and EU law is not a finite frontend feature: applicability depends on establishment, markets, data practices, business size, goods, distribution roles and national implementation. Requirements below distinguish implemented demo controls from conditional launch obligations. Research was checked on 14 September 2026; later releases need a new applicability review.

## Search and search-agent discovery

The previous frontend supplied an almost empty initial HTML document and placed a noindex directive on every rendered page. That excluded even legitimate portfolio content from indexing. The revised architecture creates HTML for each maintained route at build time, using the same visible application content delivered to people. Search crawlers and browsers that do not execute JavaScript can read the collection, journal and legal pages. JavaScript progressively restores the interactive application; there is no user-agent-dependent content swap.

Google explains that JavaScript sites require crawling, rendering and indexing stages. Useful initial HTML, crawlable links, meaningful status codes and consistent metadata reduce avoidable discovery problems. Each public route receives its own title, description, canonical URL and social preview. Unknown paths must produce HTTP 404 rather than a successful home-page shell. The sitemap contains only indexable canonical pages; bag, checkout, account and unknown pages remain noindex. Crawling those pages is allowed so crawlers can see their exclusion directive.[1]

Search-agent optimization is treated as clear information architecture, not a separate ranking trick. Google states that ordinary SEO foundations apply to AI Overviews and AI Mode, with no special schema or AI text file required. Important information must be textual, internally linked and consistent with structured data. Eligibility does not guarantee indexing or citation. Chronos therefore describes itself explicitly as a design demo and supplies meaningful headings and factual descriptions rather than adding keyword repetition or fabricated merchant authority.[2]

The structured-data graph identifies the website and its creator, describes editorial pages as articles, and uses Product metadata for connected WooCommerce records (the optional isolated preview uses CreativeWork for fictional concepts). It deliberately omits merchant offers, aggregate ratings, purchase availability and fictitious customer reviews. Prices visible in the demonstration are not a basis for real merchant listings. Canonicals and social URLs come from the typed public site configuration; route content is maintained in validated data. Indexability is separate from commerce mode, so a portfolio can be indexed while payments remain disabled.

Search Console ownership verification and post-release URL inspection are the appropriate next measurement steps for an account holder. No verification token is invented, and no indexing submission or search ranking result is claimed without evidence. Robots directives are discovery instructions, not authentication or data protection. Cloudflare's cache behaviour must also be considered: HTML is not cached by default merely because a site is proxied. A proposed HTML edge-cache policy is a separate, measurable operating decision.[3]

## Application and delivery security

The frontend origin serves built assets; the browser and dynamic route validator use a separate WordPress database/API system. Connected account/contact/order and test-payment endpoints are active. Production mounts contain the built release and web-server configuration, not source credentials or the WordPress tree. This removes several common attack paths, but does not eliminate browser, supply-chain, CDN-account, host or denial-of-service risks.

The response policy restricts scripts to the site's own origin and disables inline event handlers, external frames, plugins, form submissions and workers. Styles retain inline-style support because the existing motion and component libraries use style attributes. That exception is documented rather than described as a maximally strict CSP. A CSP is defence in depth; it does not replace safe rendering or input validation. The application continues to render maintained text through React and escapes less-than characters in structured-data serialization.[4]

Other controls include MIME-sniffing prevention, clickjacking protection, a restrictive browser permissions policy, same-origin opener/resource policies, and host-scoped HSTS. HSTS does not include unrelated subdomains and is not submitted for preload. The static server accepts only GET and HEAD, rejects sensitive file suffixes and dot paths, limits request-body size and timeouts, and has an aggregate origin request budget. This aggregate budget is not a per-visitor bot classifier or proof of high traffic capacity.[5]

The container runs without root privileges, with a read-only filesystem, dropped Linux capabilities, no privilege escalation, a private loopback binding and explicit CPU, memory and process limits. A health check and restart policy support recovery. Versioned releases and a verified local archive support rollback. None of these controls creates a second origin or guarantees uptime during a host failure. The shared host and other applications must not be modified casually to pursue a storefront-only requirement.

Dependencies are checked against the real package registry and upstream advisories. The baseline root dependency audit reported 20 findings, including 15 high. Compatible updates were followed by a Vite toolchain update and a React Router migration because the remaining router advisories required the patched 7.18 line. The advisory concerning SSR hydration does not describe this declarative router's deployed execution path, but retaining a known affected package is unnecessary when the supported upgrade can be tested.[6]

An audit with zero current findings is only a statement about the registry advisory set at the time of the scan. It is not proof that every dependency is free of defects. Release gates also cover types, lint, a production build, real browser flows, configuration boundaries, secret scanning and a separate review. Server-authoritative pricing, permissions, idempotency and test payment persistence were repaired and verified. Browser JWT storage and real-business/provider operating requirements remain commercial-launch review topics.

## Privacy: what the demo actually does

The application saves a user-requested selection in local storage. It does not need to write an empty selection when a visitor first opens the site. Clearing the selection removes its stored key, and a blocked storage API should degrade to an in-memory selection. The connected contact form stores name, email, subject and message in the administrator-only WordPress inbox. Failure preserves the unsent note; a saved-record acknowledgement establishes success. The external developer link remains a separate contact option.

Local storage is covered by rules about access to terminal equipment as well as by ordinary privacy analysis. CNIL distinguishes consent-requiring trackers from operations strictly necessary for a service explicitly requested by the visitor, including shopping-basket functionality. This does not mean that every preference, analytics script or persistent identifier can be declared necessary. The demo uses no advertising or behavioural analytics integration; adding one requires a new assessment before it loads.[7]

The connected website processes both network metadata and submitted account/contact/order data. Cloudflare and the hosting provider participate in delivering requests and protecting infrastructure. IP addresses, request metadata and diagnostic records exist alongside the active CMS customer/contact/order database. The privacy page therefore must not say that no data reaches any server or that hosting is anonymous. Routine storefront access logging is disabled in the new configuration, and container diagnostic logs are size-bounded; provider and shared-host processing remains separate.

Cloudflare documents security cookies and potential processing in the United States. The notice links to its policy and explains that security cookies may be used rather than claiming a cookie observed in documentation is necessarily set for every visitor. Provider retention is not invented. A complete commercial privacy programme would require actual contracts, transfer terms, retention decisions and a workable rights-request channel.[8]

GDPR territorial applicability is not determined solely by the visitor's nationality or the fact that a page can be opened in Europe. Establishment, intentionally offering goods or services to people in the Union, and monitoring their behaviour are central considerations. The EDPB's territorial guidance is relevant when a developer outside the EU targets that market. This demo review does not manufacture an EU representative or claim an exemption without the necessary facts.[9]

Where GDPR applies, Articles 5 and 6 require principled, lawful processing; Article 13 requires information about identity, purposes, legal basis, recipients, retention, transfers and rights. Processors, security measures, incident handling and international transfer mechanisms also need real operational decisions. A frontend paragraph cannot substitute for these arrangements. Before launch, the operator must identify the controller, supply reliable contact details and assess whether an EU representative or DPO is actually required.[10]

US privacy applicability is fragmented. CCPA/CPRA scope must be assessed using the actual business and processing facts, not the site's visitor count alone. The California Privacy Protection Agency publishes an inflation-adjusted revenue threshold of$26,625,000 effective 1 January 2025, alongside other statutory applicability tests. Older summaries that still quote$25 million as the current adjusted figure are insufficient. Other states may use different thresholds, exemptions and requirements; the current demo lacks the business facts needed to clear every state.[11]

The demo does not sell personal information or share it for cross-context behavioural advertising, and it has no advertising profiling feature. That behaviour remains the same whether a Global Privacy Control or Do Not Track signal is present. This is not a claim to have built a future sale/sharing opt-out platform. Child-directed services and collection from children require a separate COPPA and local-law assessment before launch; the present experience does not solicit children's data.

## Consumer protection and commercial launch

US advertising must be truthful, substantiated and not misleading. The FTC also prohibits specified fake reviews and testimonials, including claims attributed to nonexistent people or people without the represented experience. Chronos therefore discloses that its products and visuals are concepts, avoids fabricated customer reviews, and does not market invented specifications as tested performance. A small footer should not be the only place a visitor learns that a realistic product is fictional: product-level disclosures remain important.[12][13]

Actual US online merchandise sales would bring shipment representations and delay/refund handling into scope. The FTC's Mail, Internet, or Telephone Order Merchandise Rule requires a reasonable basis for the advertised shipping period and sets a default 30-day period in relevant cases where none is stated. A working merchant implementation needs inventory, fulfilment promises and an operational cancellation/refund process. Those promises are not added to a demo that ships nothing.[14]

EU distance sales require pre-contract information about the trader, product characteristics, total price and relevant charges, delivery, complaints and withdrawal rights. The general withdrawal period is 14 days, with exceptions and consequences for missing required information. Statutory guarantees are distinct from optional commercial warranties; EU guidance describes a minimum two-year legal guarantee for goods. A blanket 'no refunds' clause would be inappropriate. Checkout wording, order confirmation and durable-medium information need review when a real transaction is introduced.[15][16]

Product safety is also substantive. The General Product Safety Regulation creates responsibilities for economic operators and particular information duties for online offers. A real watch seller must establish its role, identify the manufacturer and relevant EU responsible person, maintain product identification and provide applicable warnings. Merely adding a 'GPSR compliant' badge does not supply these facts or prove safe materials, water resistance, batteries or mechanical performance.[17]

The wider launch review must classify the actual watch: mechanical, battery-powered, connected or child-oriented products can engage different product, battery, radio, chemical, labelling, waste and national requirements. Tax/VAT, import duties, sales-tax nexus, sanctions, trademark clearance and shipping markets also depend on real business operations. They are intentionally listed as unresolved commercial launch work, not silently treated as completed frontend features.

Email marketing is disabled. If introduced, US CAN-SPAM requirements include accurate message identification, appropriate disclosures and a functioning opt-out process; EU electronic-marketing rules also require jurisdiction-specific consent and exception analysis. No newsletter endpoint, consent record or unsubscribe promise is simulated as a real service.[18]

## Accessibility and synthetic media

Accessibility is a product requirement as well as a legal consideration. US DOJ guidance explains that businesses open to the public must address website accessibility and identifies technical guidance such as WCAG. The TitleII rule for state/local government is not automatically the statutory standard for every private storefront. A private portfolio should not claim government-rule certification from an automated scan.[19]

The European Accessibility Act applies from 28 June 2025 to covered products and services, including relevant e-commerce services. Scope, microenterprise service exemptions and national implementation matter. The present demo takes practical steps—keyboard operation, headings, labelled controls, skip navigation, reduced motion, text alternatives and static fallbacks—without declaring a legal exemption or certified conformity.[20]

Automated accessibility checks can detect missing labels, structural errors and some contrast problems. They cannot fully establish usability with all assistive technologies, cognitive accessibility, meaningful alternative text or every WCAG criterion. A commercial handoff requires manual keyboard and representative screen-reader testing as well as the measured automated report. The accessibility page states capabilities and limits, rather than using an overlay or a certification badge.

The realistic campaign images and silent films are AI-generated illustrations. EU AI Act Article 50 distinguishes provider marking obligations from deployer disclosure obligations. Its creative/fictional-work provision permits appropriate disclosure that does not hamper enjoyment of the work; the exact applicability of deepfake-related duties still depends on the content and role. Chronos identifies the synthetic nature of the work visibly and does not claim to have supplied cryptographic provenance or every model-provider obligation.[21]

US copyright analysis distinguishes human authorship from material generated solely by AI. Creative direction, selection or editing does not justify a blanket claim of exclusive copyright in every generated pixel. Preserve the asset provenance, applicable model terms, licences for fonts and software, and review trademark or likeness concerns before client reuse. These provenance records are more defensible than an unqualified 'fully owned and legally cleared' claim.[22]

## Implementation and launch matrix

| Area | Demo action | Required before real commerce |
|---|---|---|
| Discovery | Rendered HTML, unique metadata, canonical sitemap, truthful graph | Verified merchant identity and genuine offers before merchant markup |
| Browser security | Tested CSP, restricted capabilities and static-only methods | Separate API authorization, validation, CSRF/session and payment review |
| Dependency maintenance | Registry audit, patched packages and regression gates | Scheduled ownership, advisory triage and tested upgrades |
| Local storage | Request-driven selection, clear action, blocked-storage fallback | Purpose/retention/consent review for each new storage feature |
| Privacy | Accurate demo notice and provider links | Controller identity, lawful bases, contacts, contracts, retention and transfer assessment |
| Marketing | No mailing, ads, profiling or fabricated reviews | Valid consent/opt-out records and substantiated claims |
| US sales | No fulfilment or warranty promises in demo | Shipping rule, returns/warranties, state-law and tax review |
| EU sales | No fictional trader or product-compliance claims | Distance-sale information, withdrawal, guarantees, GPSR and national product review |
| Accessibility | Semantic UI, motion alternatives and recorded checks | Manual assistive-technology assessment and applicable-law review |
| AI imagery | Clear fictional/synthetic disclosure | Rights, provenance, model terms and content-specific legal review |
| Capacity/availability | Auditable target and bounded measurement tooling | Representative distributed load/failure evidence and funded operating design |

## Sources

[1] Google Search Central. [Understand JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

[2] Google Search Central. [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features), updated 10 December 2025.

[3] Cloudflare. [Default cache behaviour](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/).

[4] OWASP. [Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).

[5] NGINX. [HTTP core module](https://nginx.org/en/docs/http/ngx_http_core_module.html) and [request limit module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html).

[6] React Router maintainers. [Unexpected external redirect advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6) and [SSR constructor injection advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg),22 July 2026.

[7] CNIL. [Cookies et traceurs: que dit la loi?](https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi).

[8] Cloudflare. [Cloudflare cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/), updated 5May 2026.

[9] EDPB. [Guidelines 3/2018 on territorial scope](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf).

[10] European Union. [Regulation(EU)2016/679, GDPR](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679), particularly Articles 3,5,6,13,28,32–34 and 44–49.

[11] California Privacy Protection Agency. [Adjusted monetary thresholds](https://cppa.ca.gov/regulations/cpi_adjustment.html), effective 1 January 2025; [FAQs](https://cppa.ca.gov/faq).

[12] FTC. [Advertising and marketing](https://www.ftc.gov/business-guidance/advertising-marketing).

[13] FTC. [Final rule banning fake reviews and testimonials](https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials),2024.

[14] FTC. [Business guide to the Mail, Internet, or Telephone Order Merchandise Rule](https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule).

[15] European Union, Your Europe. [E-commerce, distance and off-premises selling](https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm).

[16] European Union, Your Europe. [Consumer guarantees](https://europa.eu/youreurope/business/selling-in-eu/consumer-contracts-guarantees/consumer-guarantees/index_en.htm).

[17] EUR-Lex. [General Product Safety Regulation summary](https://eur-lex.europa.eu/EN/legal-content/summary/general-product-safety-regulation-2023.html); European Commission [GPSR questions and answers](https://webgate.ec.europa.eu/safety/consumers/consumers_safety_gate/obligationsForBusinesses/documents/Q%26A.pdf).

[18] FTC. [CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business).

[19] US Department of Justice. [Guidance on web accessibility and the ADA](https://www.ada.gov/resources/web-guidance/).

[20] Council of the European Union. [Accessibility of products and services](https://www.consilium.europa.eu/en/policies/accessibility-goods-services/).

[21] European Commission. [Transparency obligations under Article 50 of the AI Act](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act); [Regulation(EU)2024/1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689).

[22] US Copyright Office. [Copyright and artificial intelligence](https://www.copyright.gov/ai/), including the 2025 copyrightability report.

## Connected privacy update — 15 September 2026

The live privacy page now describes WordPress accounts, password hashes, browser sign-in tokens, local selection storage, persisted contact messages and demonstration orders/test checkout. It offers a contact route for data-rights requests and asks visitors not to submit sensitive information or reuse important passwords. Contact intake stores a record without sending email. The operator still needs an explicit retention/deletion schedule, processor arrangements and market-specific lawful-purpose analysis before real business use. Earlier clipboard-only observations describe the former isolated preview and must not be applied to the connected deployment.
