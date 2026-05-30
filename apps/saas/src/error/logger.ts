/**
 * Error Logger for BarberZap
 * Handles structured logging of errors in development and production
 */

import type { AppError, ErrorLogEntry, ErrorMetrics, ErrorContext } from './types';

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 errors in memory
  private isDev = import.meta.env.DEV;
  private isBrowser = typeof window !== 'undefined';

  /**
   * Generate a unique ID for error log entry
   */
  private generateId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current error context
   */
  private getInitialContext(): Partial<ErrorContext> {
    return {
      timestamp: new Date().toISOString(),
      userAgent: this.isBrowser ? navigator.userAgent : 'unknown',
      route: this.isBrowser ? window.location.pathname : 'unknown',
    };
  }

  /**
   * Extract stack trace from error
   */
  private getStackTrace(error: Error | unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return undefined;
  }

  /**
   * Format error for development console
   */
  private formatForConsole(log: ErrorLogEntry): string {
    const emoji = this.getSeverityEmoji(log.severity);
    const header = `${emoji} [${log.code}] ${log.message}`;
    
    const details = {
      category: log.category,
      severity: log.severity,
      timestamp: log.timestamp,
      context: log.context,
      recoverable: log.recoverable,
      retryable: log.retryable,
      userMessage: log.userMessage,
      recoverySuggestions: log.recoverySuggestions,
    };

    // In dev, format nicely; in prod, format compact
    if (this.isDev) {
      return `${header}\n${JSON.stringify(details, null, 2)}`;
    }

    return `${header} | ${log.userMessage}`;
  }

  /**
   * Get emoji for error severity
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };
    return emojis[severity] || '⚪';
  }

  /**
   * Sanitize context for logging (remove sensitive data)
   */
  private sanitizeContext(context: Partial<ErrorContext>): Partial<ErrorContext> {
    const sanitized: Partial<ErrorContext> = { ...context };
    
    if (sanitized.additionalData) {
      const cleanData: Record<string, unknown> = {};
      Object.keys(sanitized.additionalData).forEach(key => {
        // Don't log passwords, tokens, etc.
        if (!key.toLowerCase().includes('password') && 
            !key.toLowerCase().includes('token') &&
            !key.toLowerCase().includes('secret')) {
          cleanData[key] = sanitized.additionalData![key];
        }
      });
      sanitized.additionalData = cleanData;
    }

    return sanitized;
  }

  /**
   * Log an error
   */
  public log(error: AppError): ErrorLogEntry {
    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: error.context.timestamp || new Date().toISOString(),
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      context: this.sanitizeContext(error.context),
      stack: this.getStackTrace(error),
      recoverable: error.recoverable,
      retryable: error.retryable,
      recoverySuggestions: error.recoverySuggestions,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging
    if (this.isDev) {
      console.error(this.formatForConsole(logEntry));
      if (logEntry.stack) {
        console.error('Stack trace:', logEntry.stack);
      }
    } else {
      // Production: minimal console output
      console.error(
        `[${logEntry.code}] ${logEntry.userMessage} ` +
        `(Error ID: ${logEntry.id})`
      );
    }

    // TODO: Send to external monitoring service (Sentry, etc.)
    // this.sendToMonitoring(logEntry);

    return logEntry;
  }

  /**
   * Get error metrics
   */
  public getMetrics(): ErrorMetrics {
    const metrics: ErrorMetrics = {
      totalErrors: this.logs.length,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      errorsByCode: {} as Record<string, number>,
      recentErrors: this.logs.slice(-20),
    };

    // Initialize counters
    Object.values(errorCategory).forEach(cat => {
      metrics.errorsByCategory[cat] = 0;
    });
    Object.values(errorSeverity).forEach(sev => {
      metrics.errorsBySeverity[sev] = 0;
    });

    // Count errors
    this.logs.forEach(log => {
      metrics.errorsByCategory[log.category]++;
      metrics.errorsBySeverity[log.severity]++;
      metrics.errorsByCode[log.code] = (metrics.errorsByCode[log.code] || 0) + 1;
    });

    return metrics;
  }

  /**
   * Get recent errors
   */
  public getRecentErrors(count: number = 10): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs (useful for testing)
   */
  public clear(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Send to external monitoring service (placeholder)
   */
  private async sendToMonitoring(log: ErrorLogEntry): Promise<void> {
    // TODO: Implement Sentry or other monitoring service integration
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(log, {
    //     level: log.severity,
    //     tags: {
    //       category: log.category,
    //       code: log.code,
    //     },
    //     extra: log.context,
    //   });
    // }
  }
}

// Import enums (need to define them here since they're in types.ts)
const errorCategory = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'auth',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  SERVER: 'server',
  UNKNOWN: 'unknown',
} as const;

const errorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Singleton instance
export const errorLogger = new ErrorLogger();
