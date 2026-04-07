import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = 'Chronos';
const DEFAULT_DESCRIPTION = 'Luxury watches curated for the discerning collector. Explore our collection of fine timepieces from the world\'s most prestigious brands.';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://chronos.healthcodeanalysis.com';

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = 'website',
  price,
  currency = 'USD',
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Luxury Watches`;
  const canonicalUrl = url || SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      {image && <meta property="og:image" content={image} />}

      {/* Product-specific OG tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={String(price)} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
