// ================================================================
// BLOG ARTICLE PAGE SKELETON
// ================================================================
// Loading skeleton for BlogArticlePage
// Matches the layout of BlogArticlePage.tsx

export default function BlogArticlePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div className="h-full bg-blue-600 w-0" />
      </div>

      {/* Header placeholder */}
      <div className="h-16 bg-white border-b border-gray-200" />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Header */}
        <div className="max-w-3xl mx-auto mb-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>

          {/* Category badge */}
          <div className="h-6 bg-gray-200 rounded-full w-32 mb-4 animate-pulse" />

          {/* Title */}
          <div className="h-10 bg-gray-200 rounded w-full mb-2 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-3/4 mb-6 animate-pulse" />

          {/* Meta info */}
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            {/* Paragraph skeletons */}
            <div className="space-y-4 mb-8">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            </div>

            {/* Heading skeleton */}
            <div className="h-7 bg-gray-200 rounded w-2/3 mb-4 animate-pulse" />

            <div className="space-y-4 mb-8">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
            </div>

            {/* List skeleton */}
            <div className="space-y-3 mb-8 ml-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse" />
                </div>
              ))}
            </div>

            {/* Heading skeleton */}
            <div className="h-7 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />

            <div className="space-y-4 mb-8">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Code block skeleton */}
            <div className="h-32 bg-gray-800 rounded-lg mb-8 animate-pulse" />

            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          </div>

          {/* Author Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Related Posts */}
          <div className="mt-12">
            <div className="h-7 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="h-5 bg-gray-200 rounded-full w-20 mb-3 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-full mb-2 animate-pulse" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer placeholder */}
      <div className="h-64 bg-gray-900" />
    </div>
  );
}
