import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const ENV = import.meta.env.MODE || (import.meta.env.DEV ? 'development' : 'production');

let isInitialized = false;

export function initMonitoring(): void {
  if (!DSN || isInitialized) return;
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    // Keep sampling very conservative for MVP
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
  isInitialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!isInitialized) return;
  const extras = context || {};
  Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
    level: 'error',
    extra: extras,
  });
}

// Auto-init on import
try { initMonitoring(); } catch {}


