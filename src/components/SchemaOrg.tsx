// ================================================================
// SCHEMA.ORG STRUCTURED DATA COMPONENT
// ================================================================
// Adds JSON-LD structured data for rich snippets in Google search
// Supports: SoftwareApplication, Reviews, FAQs, Organization

import { Helmet } from 'react-helmet-async';

// ================================================================
// SOFTWARE APPLICATION SCHEMA
// ================================================================
export interface SoftwareApplicationSchemaProps {
  name: string;
  description: string;
  applicationCategory: string;
  price?: string;
  priceCurrency?: string;
  ratingValue?: string;
  ratingCount?: string;
  screenshot?: string;
}

export function SoftwareApplicationSchema({
  name = 'ResumeTune',
  description = 'AI-powered resume and cover letter generator that helps job seekers get 40% more interviews.',
  applicationCategory = 'BusinessApplication',
  price = '0',
  priceCurrency = 'USD',
  ratingValue = '4.8',
  ratingCount = '1247',
  screenshot = 'https://resumetune.io/screenshot.png',
}: SoftwareApplicationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    applicationCategory,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      ratingCount,
      bestRating: '5',
      worstRating: '1',
    },
    description,
    screenshot,
    operatingSystem: 'Web',
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ================================================================
// REVIEW SCHEMA
// ================================================================
export interface ReviewSchemaProps {
  itemName: string;
  ratingValue: string;
  authorName: string;
  reviewBody: string;
  datePublished?: string;
}

export function ReviewSchema({
  itemName = 'ResumeTune',
  ratingValue,
  authorName,
  reviewBody,
  datePublished,
}: ReviewSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: itemName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue,
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: authorName,
    },
    reviewBody,
    ...(datePublished && { datePublished }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ================================================================
// FAQ SCHEMA
// ================================================================
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSchemaProps {
  faqs: FAQItem[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ================================================================
// ORGANIZATION SCHEMA
// ================================================================
export interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  foundingDate?: string;
}

export function OrganizationSchema({
  name = 'ResumeTune',
  url = 'https://resumetune.io',
  logo = 'https://resumetune.io/logo.png',
  description = 'AI-powered career tools for job seekers',
  email = 'hello@resumetune.io',
  foundingDate = '2024',
}: OrganizationSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    email,
    foundingDate,
    sameAs: [
      'https://twitter.com/resumetune',
      'https://linkedin.com/company/resumetune',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// ================================================================
// COMPOSITE SCHEMA (Use all at once)
// ================================================================
export interface LandingPageSchemaProps {
  includeApp?: boolean;
  includeOrganization?: boolean;
  reviews?: ReviewSchemaProps[];
  faqs?: FAQItem[];
}

export function LandingPageSchema({
  includeApp = true,
  includeOrganization = true,
  reviews = [],
  faqs = [],
}: LandingPageSchemaProps) {
  return (
    <>
      {includeApp && <SoftwareApplicationSchema />}
      {includeOrganization && <OrganizationSchema />}
      {reviews.map((review, index) => (
        <ReviewSchema key={index} {...review} />
      ))}
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
    </>
  );
}
