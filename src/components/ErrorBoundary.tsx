import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((props: { onRetry: () => void }) => React.ReactNode);
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    logger.error('ErrorBoundary caught error', error, { componentStack: info?.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      // If custom fallback is provided
      if (fallback) {
        // Check if fallback is a function (render prop pattern)
        if (typeof fallback === 'function') {
          return fallback({ onRetry: this.handleRetry });
        }
        // Otherwise render the fallback component as-is
        return fallback;
      }

      // Default fallback (full-page error)
      return <Fallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const Fallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
          <h2 className="text-lg font-semibold text-red-800">{t('errors.unknown')}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">{t('errors.tryAgain') || ''}</p>
        <button onClick={onRetry} className="px-4 py-2 inline-flex items-center space-x-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />
          <span>{t('profile.save') /* reuse a translated label to avoid new key */}</span>
        </button>
      </div>
    </div>
  );
};


