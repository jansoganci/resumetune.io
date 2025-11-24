// ================================================================
// QUOTA SKELETON - PHASE 3 UX POLISH
// ================================================================
// Loading skeleton for QuotaIndicator component
// Provides visual feedback while quota data is being fetched

interface QuotaSkeletonProps {
  className?: string;
}

export function QuotaSkeleton({ className = '' }: QuotaSkeletonProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Icon skeleton */}
      <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />

      {/* Text skeleton */}
      <div className="w-6 h-4 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
