import Header from '../components/Header';
import Landing from '../components/Landing';
import Footer from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { LandingPageSchema } from '../components/SchemaOrg';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* SEO Meta Tags */}
      <SEOHead
        title="ResumeTune - AI Resume & Cover Letter Generator | Get 40% More Interviews"
        description="Generate personalized cover letters and ATS-optimized resumes in 15 seconds. Join 10,000+ job seekers getting 40% more interviews. Free trial, no credit card required."
        keywords="AI resume builder, cover letter generator, ATS resume optimizer, job application generator, resume optimization, career tools, job search, AI cover letter"
        canonicalUrl="https://resumetune.io/landing"
        ogType="website"
        ogImage="https://resumetune.io/og-image.png"
        twitterCard="summary_large_image"
      />

      {/* Schema.org Structured Data */}
      <LandingPageSchema
        includeApp={true}
        includeOrganization={true}
        reviews={[
          {
            itemName: 'ResumeTune',
            ratingValue: '5',
            authorName: 'Sarah M.',
            reviewBody: 'Got 3 interviews in my first week using this! The 15-second generation saved me hours. My applications actually match the job requirements now.',
          },
          {
            itemName: 'ResumeTune',
            ratingValue: '5',
            authorName: 'Michael R.',
            reviewBody: 'Cut my application time from 2 hours to 2 minutes. The AI actually understands what employers want. Landed my dream job at InnovateCorp!',
          },
          {
            itemName: 'ResumeTune',
            ratingValue: '5',
            authorName: 'Jessica L.',
            reviewBody: 'Finally, applications that don\'t sound generic! The personalized approach helped me stand out. 40% more interview callbacks than before.',
          },
        ]}
      />

      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Landing />
      </main>
      
      <Footer />
    </div>
  );
}
