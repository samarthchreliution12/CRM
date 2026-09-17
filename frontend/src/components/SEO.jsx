import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_SITE_NAME = 'Parshwa Consultancy';
const DEFAULT_DOMAIN = 'https://parshwaconsultancy.in';
const DEFAULT_IMAGE = `${DEFAULT_DOMAIN}/og-image.png`;
const DEFAULT_DESCRIPTION = 'Parshwa Consultancy provides investment and financial consulting services including equity, mutual funds, IPO, insurance and unclaimed investment recovery.';

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  keywords,
  noindex = false,
  // Open Graph
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogUrl,
  ogType = 'website',
  // Twitter
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  // JSON-LD Structured Data Schema
  schemaData,
}) => {
  const fullTitle = title ? `${title} | ${DEFAULT_SITE_NAME}` : `${DEFAULT_SITE_NAME} | Investment & Consulting Experts`;
  
  // Clean canonical URL formatting
  let formattedCanonical = DEFAULT_DOMAIN;
  if (canonical) {
    if (canonical.startsWith('http://') || canonical.startsWith('https://')) {
      formattedCanonical = canonical;
    } else {
      const cleanPath = canonical.startsWith('/') ? canonical : `/${canonical}`;
      formattedCanonical = `${DEFAULT_DOMAIN}${cleanPath === '/' ? '' : cleanPath}`;
    }
  }

  const currentOgUrl = ogUrl ? (ogUrl.startsWith('http') ? ogUrl : `${DEFAULT_DOMAIN}${ogUrl}`) : formattedCanonical;

  return (
    <Helmet>
      {/* Standard SEO Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && (
        <meta
          name="keywords"
          content={Array.isArray(keywords) ? keywords.join(', ') : keywords}
        />
      )}

      {/* Indexability / Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical URL - Only included if not noindex */}
      {!noindex && <link rel="canonical" href={formattedCanonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentOgUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={twitterTitle || ogTitle || fullTitle} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      <meta name="twitter:image" content={twitterImage || ogImage} />

      {/* JSON-LD Schema Markup */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
