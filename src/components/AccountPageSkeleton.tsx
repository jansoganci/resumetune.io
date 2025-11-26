// ================================================================
// ACCOUNT PAGE SKELETON - PHASE 3 UX POLISH
// ================================================================
// Loading skeleton components for AccountPage
// Provides visual feedback while account data is being fetched

export function AccountHeaderSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AccountInfoSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProfileCompletenessSkeleton() {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-yellow-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-yellow-200 rounded w-64 animate-pulse" />
        </div>
        <div className="h-11 bg-yellow-200 rounded-lg w-32 animate-pulse" />
      </div>
      <div className="mt-4 w-full bg-yellow-200 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

export function GDPRSectionSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-11 bg-gray-200 rounded-lg flex-1 animate-pulse" />
          <div className="h-11 bg-gray-200 rounded-lg flex-1 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function AccountPageSkeletons() {
  return (
    <>
      <AccountHeaderSkeleton />
      <ProfileCompletenessSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlanCardSkeleton />
        <PlanCardSkeleton />
      </div>
      <AccountInfoSkeleton />
      <AccountInfoSkeleton />
      <GDPRSectionSkeleton />
    </>
  );
}
