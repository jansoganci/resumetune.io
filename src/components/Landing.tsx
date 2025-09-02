import { Zap, FileText, AlertCircle, Users, Shield, Clock, Star, CheckCircle } from 'lucide-react';

export default function Landing(): JSX.Element {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Generate Perfect Job Applications in 15 Seconds
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Fill your profile once. Paste any job description. Get AI-powered, personalized application documents that actually fit the job.
        </p>
        
        {/* Enhanced Social Proof */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Join 10,000+ job seekers</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">4.8/5 rating</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium">40% more interviews</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-medium">Save 2.5 hours per application</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a 
            href="/" 
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-lg min-h-[48px] flex items-center justify-center"
          >
            Create My First Application
          </a>
          <a 
            href="/pricing" 
            className="px-8 py-4 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-lg min-h-[48px] flex items-center justify-center"
          >
            View Pricing Plans
          </a>
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4 text-green-600" />
            <span>SSL Secured & Privacy-first</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>3 free applications daily</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>30-day money-back guarantee</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Everything You Need to Stand Out
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Job Match</h3>
            <p className="text-gray-600">
              Get immediate feedback on how well your background aligns with the job requirements. 
              Save time by focusing on the right opportunities.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tailored Cover Letters</h3>
            <p className="text-gray-600">
              Generate personalized cover letters that highlight your relevant experience and 
              demonstrate genuine interest in the role and company.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ATS-Optimized Resume</h3>
            <p className="text-gray-600">
              Improve your resume's ATS compatibility while preserving your unique story. 
              Get suggestions that boost your chances of passing initial screenings.
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Real Success Stories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              "Got 3 interviews in my first week using this! The 15-second generation saved me hours. 
              My applications actually match the job requirements now."
            </p>
            <div className="text-sm text-gray-600">
              <strong>Sarah M.</strong> - Software Engineer at TechFlow Solutions
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              "Cut my application time from 2 hours to 2 minutes. The AI actually understands 
              what employers want. Landed my dream job at InnovateCorp!"
            </p>
            <div className="text-sm text-gray-600">
              <strong>Michael R.</strong> - Product Manager at InnovateCorp
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              "Finally, applications that don't sound generic! The personalized approach 
              helped me stand out. 40% more interview callbacks than before."
            </p>
            <div className="text-sm text-gray-600">
              <strong>Jessica L.</strong> - Marketing Manager at BrandVision Agency
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How It Works (3 Simple Steps)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Profile</h3>
            <p className="text-gray-600">
              Add your experience, skills, and achievements once. We'll remember everything for future applications.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paste Job Description</h3>
            <p className="text-gray-600">
              Copy any job posting from LinkedIn, Indeed, or company websites. Our AI analyzes the requirements instantly.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Tailored Documents</h3>
            <p className="text-gray-600">
              Receive personalized cover letter and resume optimized for that specific role in just 15 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Final CTA Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 text-center border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Transform Your Job Search?
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Join 10,000+ professionals who've accelerated their job search. Try 3 applications free, 
          no credit card required. Start your transformation today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="/" 
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-lg min-h-[48px] flex items-center justify-center"
          >
            Create My First Application
          </a>
          <a 
            href="/blog" 
            className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-lg border border-gray-200 min-h-[48px] flex items-center justify-center"
          >
            Read Success Stories
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          ✓ 30-day money-back guarantee ✓ SSL secured ✓ No spam, unsubscribe anytime
        </p>
      </section>
    </div>
  );
}


