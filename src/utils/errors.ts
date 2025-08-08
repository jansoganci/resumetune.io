export enum ErrorCode {
  NetworkError = 'network_error',
  Timeout = 'timeout',
  InvalidInput = 'invalid_input',
  ExportFailed = 'export_failed',
  AiFailed = 'ai_failed',
  Unknown = 'unknown'
}

export interface ErrorMessagePayload {
  messageKey: string;
  params?: Record<string, string | number | boolean>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly messageKey: string;
  public readonly params?: Record<string, string | number | boolean>;
  public readonly cause?: unknown;

  constructor(options: {
    code: ErrorCode;
    messageKey: string;
    message?: string;
    params?: Record<string, string | number | boolean>;
    cause?: unknown;
  }) {
    super(options.message || options.messageKey);
    this.name = 'AppError';
    this.code = options.code;
    this.messageKey = options.messageKey;
    this.params = options.params;
    this.cause = options.cause;
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return Boolean(error) && (error as any).name === 'AppError';
};

const looksLikeNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  const err = error as any;
  return (
    err?.name === 'TypeError' &&
    /Failed to fetch|NetworkError|Load failed|fetch/.test(String(err?.message || ''))
  );
};

export const mapUnknownError = (error: unknown): AppError => {
  if (isAppError(error)) return error;

  if (looksLikeNetworkError(error)) {
    return new AppError({
      code: ErrorCode.NetworkError,
      messageKey: 'errors.networkError',
      cause: error
    });
  }

  const message = String((error as any)?.message || '');
  if (/timeout|timed out|ETIMEDOUT/i.test(message)) {
    return new AppError({
      code: ErrorCode.Timeout,
      messageKey: 'errors.timeout',
      cause: error
    });
  }

  return new AppError({
    code: ErrorCode.Unknown,
    messageKey: 'errors.unknown',
    cause: error
  });
};

export const handleApiError = (error: unknown): ErrorMessagePayload => {
  const appError = mapUnknownError(error);

  switch (appError.code) {
    case ErrorCode.NetworkError:
      return { messageKey: 'errors.networkError' };
    case ErrorCode.Timeout:
      return { messageKey: 'errors.timeout' };
    case ErrorCode.InvalidInput:
      return { messageKey: appError.messageKey || 'errors.invalidInput', params: appError.params };
    case ErrorCode.ExportFailed:
      return { messageKey: 'errors.exportFailed' };
    case ErrorCode.AiFailed:
      return { messageKey: 'errors.aiFailed' };
    case ErrorCode.Unknown:
    default:
      return { messageKey: appError.messageKey || 'errors.unknown' };
  }
};

export const reportError = (error: unknown, context?: Record<string, unknown>): void => {
  if (import.meta.env.DEV) {
    // Minimal dev logging; replace with Sentry in production rollout
    // eslint-disable-next-line no-console
    console.error('[reportError]', { error, context });
  }
  // Forward to Sentry (no-op if not initialized). Avoid top-level await.
  try {
    // Lazy import without await to keep function sync
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('./monitoring').then((mod) => {
      try { mod.captureError(error, context); } catch {}
    }).catch(() => {});
  } catch {}
};


