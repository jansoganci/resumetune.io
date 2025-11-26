// ================================================================
// PRICING PAGE SKELETON
// ================================================================
// Loading skeleton for PricingPage
// Matches the layout of PricingPage.tsx

export default function PricingPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header placeholder */}
      <div className="h-16 bg-white border-b border-gray-200" />

      <div className="py-12">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <div className="h-10 bg-gray-200 rounded w-96 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded w-full max-w-4xl mx-auto animate-pulse" />
        </div>

        {/* Pricing Plans Grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6"
              >
                {/* Plan name */}
                <div className="text-center mb-6">
                  <div className="h-6 bg-gray-200 rounded w-24 mx-auto mb-2 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-20 mx-auto mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                </div>

                {/* Features list */}
                <div className="space-y-3 mb-8">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="flex items-start">
                      <div className="w-5 h-5 bg-gray-200 rounded mt-0.5 mr-3 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                    </div>
                  ))}
                </div>

                {/* Button */}
                <div className="h-11 bg-gray-200 rounded-lg w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="h-8 bg-gray-200 rounded w-96 mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-full max-w-2xl mx-auto mb-12 animate-pulse" />

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="h-6 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-4 animate-pulse" />
            <div className="flex justify-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer placeholder */}
      <div className="h-64 bg-gray-900 mt-16" />
    </div>
  );
}
