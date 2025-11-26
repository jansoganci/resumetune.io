// ================================================================
// LOGIN PAGE SKELETON
// ================================================================
// Loading skeleton for Login page
// Matches the layout of Login.tsx

export default function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="p-3 bg-gray-200 rounded-lg animate-pulse">
            <div className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-6 text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse" />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Form skeleton */}
          <div className="space-y-6">
            {/* Email field */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Password field */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
            </div>

            {/* Links */}
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            </div>

            {/* Submit button */}
            <div className="h-11 bg-gray-200 rounded w-full animate-pulse" />
          </div>

          {/* Back link */}
          <div className="mt-6">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
