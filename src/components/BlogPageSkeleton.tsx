// ================================================================
// BLOG PAGE SKELETON
// ================================================================
// Loading skeleton for BlogPage
// Matches the layout of BlogPage.tsx

export default function BlogPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header placeholder */}
      <div className="h-16 bg-white border-b border-gray-200" />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 text-center border border-blue-100">
            {/* Title */}
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-gray-200 rounded-xl animate-pulse">
                <div className="w-8 h-8" />
              </div>
              <div>
                <div className="h-9 bg-gray-200 rounded w-64 mb-2 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-96 animate-pulse" />
              </div>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center space-x-8 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              ))}
            </div>

            {/* Search bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="h-12 bg-white rounded-lg animate-pulse" />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-9 bg-white rounded-full w-20 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 mt-6">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
          </div>
        </div>

        {/* Featured Post */}
        <div className="mb-12">
          <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded-full w-24 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
              <div className="h-8 bg-gray-200 rounded w-full mb-3 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-full mb-2 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="space-y-6">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="h-5 bg-gray-200 rounded-full w-20 mb-4 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-full mb-3 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="h-7 bg-gray-200 rounded w-96 mx-auto mb-3 animate-pulse" />
          <div className="h-5 bg-gray-200 rounded w-full max-w-2xl mx-auto mb-6 animate-pulse" />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="h-12 bg-gray-200 rounded-lg w-48 animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-lg w-36 animate-pulse" />
          </div>
        </div>
      </main>

      {/* Footer placeholder */}
      <div className="h-64 bg-gray-900" />
    </div>
  );
}
