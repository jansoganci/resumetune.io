import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
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


