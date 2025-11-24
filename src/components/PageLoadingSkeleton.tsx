// ================================================================
// PAGE LOADING SKELETON - SUSPENSE FALLBACK
// ================================================================
// Beautiful loading state for lazy-loaded pages
// Provides smooth UX while code chunks are fetched

import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4 px-4">
        {/* Animated spinner */}
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
          <p className="text-sm text-gray-600">Just a moment while we prepare your page</p>
        </div>

        {/* Skeleton content bars (visual polish) */}
        <div className="max-w-md mx-auto space-y-3 pt-8">
          <div className="h-4 bg-gray-200 rounded-full w-3/4 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-full w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-full w-5/6 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// Compact variant for smaller sections (optional)
export const CompactLoadingSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center space-x-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-gray-600">Loading...</span>
      </div>
    </div>
  );
};
