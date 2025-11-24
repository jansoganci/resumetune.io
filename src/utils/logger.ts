// ================================================================
// CENTRALIZED LOGGING UTILITY
// ================================================================
// Production-ready logger with environment-aware output
// Development: Colored console with detailed context
// Production: Structured JSON logs for log aggregation

// ================================================================
// LOG LEVELS
// ================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// ================================================================
// LOGGER CONFIGURATION
// ================================================================

const isDevelopment = typeof process !== 'undefined'
  ? process.env.NODE_ENV === 'development'
  : import.meta?.env?.DEV ?? false;

const isProduction = typeof process !== 'undefined'
  ? process.env.NODE_ENV === 'production'
  : import.meta?.env?.PROD ?? false;

// In production, only show WARN and ERROR
// In development, show all levels
const MIN_LOG_LEVEL = isProduction ? LogLevel.WARN : LogLevel.DEBUG;

// ================================================================
// CONSOLE COLORS (Development Only)
// ================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

// ================================================================
// LOGGER INTERFACE
// ================================================================

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

// ================================================================
// CORE LOGGER CLASS
// ================================================================

class Logger {
  /**
   * Format timestamp for logs
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Format log entry for production (JSON)
   */
  private formatProductionLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Format log entry for development (colored, readable)
   */
  private formatDevelopmentLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toLocaleTimeString();
    const levelColors = {
      [LogLevel.DEBUG]: COLORS.dim + COLORS.cyan,
      [LogLevel.INFO]: COLORS.blue,
      [LogLevel.WARN]: COLORS.yellow,
      [LogLevel.ERROR]: COLORS.red + COLORS.bright,
    };

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO ',
      [LogLevel.WARN]: 'WARN ',
      [LogLevel.ERROR]: 'ERROR',
    };

    const color = levelColors[level];
    const levelName = levelNames[level];
    const contextStr = context ? ` ${COLORS.dim}${JSON.stringify(context)}${COLORS.reset}` : '';
    const errorStr = error ? `\n${COLORS.red}${error.stack || error.message}${COLORS.reset}` : '';

    return `${COLORS.dim}[${timestamp}]${COLORS.reset} ${color}${levelName}${COLORS.reset} ${message}${contextStr}${errorStr}`;
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    // Skip if below minimum log level
    if (level < MIN_LOG_LEVEL) {
      return;
    }

    if (isProduction) {
      // Production: Structured JSON logs
      const entry: LogEntry = {
        level: LogLevel[level],
        message,
        timestamp: this.formatTimestamp(),
      };

      if (context && Object.keys(context).length > 0) {
        entry.context = context;
      }

      if (error) {
        entry.error = {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        };
      }

      const logLine = this.formatProductionLog(entry);

      // Use appropriate console method
      if (level >= LogLevel.ERROR) {
        console.error(logLine);
      } else if (level >= LogLevel.WARN) {
        console.warn(logLine);
      } else {
        console.log(logLine);
      }
    } else {
      // Development: Colored, readable logs
      const logLine = this.formatDevelopmentLog(level, message, context, error);

      if (level >= LogLevel.ERROR) {
        console.error(logLine);
      } else if (level >= LogLevel.WARN) {
        console.warn(logLine);
      } else {
        console.log(logLine);
      }
    }
  }

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging (only in development)
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging (production and development)
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging (production and development)
   */
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    if (errorOrContext instanceof Error) {
      this.log(LogLevel.ERROR, message, context, errorOrContext);
    } else {
      this.log(LogLevel.ERROR, message, errorOrContext);
    }
  }

  /**
   * Create a child logger with persistent context
   * Useful for service-specific logging
   */
  child(persistentContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      const mergedContext = { ...persistentContext, ...context };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }
}

// ================================================================
// SINGLETON EXPORT
// ================================================================

export const logger = new Logger();

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Create a service-specific logger with context
 *
 * @example
 * const log = createServiceLogger('JobMatchService');
 * log.info('Processing job match', { userId: '123' });
 */
export function createServiceLogger(serviceName: string): Logger {
  return logger.child({ service: serviceName });
}

/**
 * Create an API endpoint logger with context
 *
 * @example
 * const log = createApiLogger('/api/consume-credit');
 * log.info('Credit consumed', { userId: '123' });
 */
export function createApiLogger(endpoint: string): Logger {
  return logger.child({ endpoint });
}

/**
 * Log API request with standard format
 */
export function logApiRequest(
  endpoint: string,
  method: string,
  userId?: string,
  context?: LogContext
): void {
  logger.debug(`${method} ${endpoint}`, {
    method,
    endpoint,
    userId: userId?.substring(0, 8) + '...',
    ...context,
  });
}

/**
 * Log API response with standard format
 */
export function logApiResponse(
  endpoint: string,
  status: number,
  duration?: number,
  context?: LogContext
): void {
  const message = `${endpoint} → ${status}`;

  if (status >= 500) {
    logger.error(message, { endpoint, status, duration, ...context });
  } else if (status >= 400) {
    logger.warn(message, { endpoint, status, duration, ...context });
  } else {
    logger.debug(message, { endpoint, status, duration, ...context });
  }
}

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default logger;
