/**
 * Global Error Handler for BarberZap
 * Intercepts all unhandled errors and rejections
 */

import type { ErrorContext } from './types';
import { createError, BaseAppError } from './errors';
import { errorLogger } from './logger';

// Import toast/notification system (placeholder - will need to be connected to actual notification system)
type ToastFunction = (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void;

let toastFunction: ToastFunction | null = null;

/**
 * Register toast/notification function
 */
export function registerToast(fn: ToastFunction): void {
  toastFunction = fn;
}

/**
 * Unregister toast function
 */
export function unregisterToast(): void {
  toastFunction = null;
}

/**
 * Show toast notification for error
 */
function showToast(message: string, severity: string): void {
  if (toastFunction) {
    const type = severity === 'critical' || severity === 'high' ? 'error' : 'warning';
    toastFunction(message, type);
  }
}

/**
 * Get current context info
 */
function getCurrentContext(): ErrorContext {
  return {
    timestamp: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}

/**
 * Determine if error should notify user
 */
function shouldNotifyUser(error: BaseAppError): boolean {
  // Don't notify for low severity errors
  if (error.severity === 'low') {
    return false;
  }

  // Don't notify for expected errors that are handled elsewhere
  // (This can be customized based on app needs)
  const ignoreCodes = ['CANCELLED', 'IGNORED'];
  if (ignoreCodes.includes(error.code)) {
    return false;
  }

  return true;
}

/**
 * Get recovery suggestion based on error
 */
function getRecoveryMessage(error: BaseAppError): string {
  if (error.recoverySuggestions && error.recoverySuggestions.length > 0) {
    return error.recoverySuggestions[0];
  }
  return error.userMessage;
}

/**
 * Handle single error
 */
export function handleError(error: unknown, context?: Partial<ErrorContext>): BaseAppError {
  // Merge context with current context
  const fullContext: ErrorContext = {
    ...getCurrentContext(),
    ...context,
  };

  // Create typed error
  const appError = createError(error, fullContext);

  // Log the error
  errorLogger.log(appError);

  // Show user notification if appropriate
  if (shouldNotifyUser(appError)) {
    showToast(appError.userMessage, appError.severity);
  }

  // In development, log recovery suggestions
  if (import.meta.env.DEV && appError.recoverySuggestions) {
    console.log('📋 Recovery suggestions:');
    appError.recoverySuggestions.forEach((suggestion, i) => {
      console.log(`   ${i + 1}. ${suggestion}`);
    });
  }

  return appError;
}

/**
 * Handle uncaught error (global window error)
 */
function handleUncaughtError(event: ErrorEvent): void {
  event.preventDefault();
  
  const error = handleError(event.error, {
    component: 'window.onerror',
    additionalData: {
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    },
  });

  // Log additional details
  if (error.originalError && error.originalError instanceof Error) {
    console.error('Original error:', error.originalError);
  }
}

/**
 * Handle unhandled promise rejection
 */
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  event.preventDefault();
  
  handleError(event.reason, {
    component: 'unhandledrejection',
  });
}

/**
 * Initialize global error handlers
 */
export function initGlobalErrorHandler(): void {
  if (typeof window === 'undefined') {
    return; // Server-side, skip
  }

  // Handle uncaught errors
  window.addEventListener('error', handleUncaughtError);

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  if (import.meta.env.DEV) {
    console.log('✅ Global error handler initialized');
  }
}

/**
 * Cleanup global error handlers
 */
export function cleanupGlobalErrorHandler(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('error', handleUncaughtError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);

  if (import.meta.env.DEV) {
    console.log('🧹 Global error handler cleaned up');
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw to let caller handle if needed
    }
  };
}

/**
 * Wrap async function with silent error handling (no notification)
 */
export function withSilentErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log but don't notify user
      const appError = createError(error, { ...context });
      errorLogger.log(appError);
      return undefined;
    }
  };
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initGlobalErrorHandler();
}
