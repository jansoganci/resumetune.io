// ================================================================
// SEO HEAD COMPONENT
// ================================================================
// Reusable SEO component using react-helmet-async
// Optimized for Google, Open Graph (Facebook/LinkedIn), and Twitter

import { Helmet } from 'react-helmet-async';

export interface SEOHeadProps {
  // Basic SEO
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;

  // Open Graph (Facebook, LinkedIn)
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;

  // Twitter Card
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterImage?: string;

  // Additional
  author?: string;
  robots?: string;
  themeColor?: string;
}

export function SEOHead({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://resumetune.io/og-image.png',
  ogImageWidth = '1200',
  ogImageHeight = '630',
  twitterCard = 'summary_large_image',
  twitterSite = '@resumetune',
  twitterImage,
  author = 'ResumeTune',
  robots = 'index, follow',
  themeColor = '#2563eb', // Blue-600
}: SEOHeadProps) {
  // Use Twitter image if provided, otherwise fallback to OG image
  const finalTwitterImage = twitterImage || ogImage;

  // Construct full URL for canonical and OG
  const fullCanonicalUrl = canonicalUrl || typeof window !== 'undefined'
    ? window.location.href
    : 'https://resumetune.io';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="language" content="English" />

      {/* Robots */}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content={ogImageWidth} />
      <meta property="og:image:height" content={ogImageHeight} />
      <meta property="og:site_name" content="ResumeTune" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={finalTwitterImage} />
      <meta name="twitter:creator" content={twitterSite} />

      {/* Mobile & Theme */}
      <meta name="theme-color" content={themeColor} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Performance Hints */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
    </Helmet>
  );
}
