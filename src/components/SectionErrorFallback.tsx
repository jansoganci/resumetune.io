// ================================================================
// SECTION ERROR FALLBACK - GRANULAR ERROR BOUNDARY
// ================================================================
// Small, clean error UI for section-level errors
// Prevents entire page crashes when a single section fails

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SectionErrorFallbackProps {
  onRetry?: () => void;
  sectionName?: string;
}

export const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({
  onRetry,
  sectionName,
}) => {
  const { t } = useTranslation();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default retry: reload the page
      window.location.reload();
    }
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 my-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-amber-900 mb-2">
            {sectionName
              ? `${sectionName} ${t('errors.sectionFailed') || 'couldn\'t load'}`
              : t('errors.sectionFailed') || 'This section couldn\'t load'}
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            {t('errors.sectionFailedDescription') ||
              'An error occurred while loading this section. Other parts of the page should still work.'}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('errors.retry') || 'Retry'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Convenience wrapper for render prop pattern
export const createSectionErrorFallback = (sectionName?: string) => {
  return ({ onRetry }: { onRetry: () => void }) => (
    <SectionErrorFallback onRetry={onRetry} sectionName={sectionName} />
  );
};
