/**
 * Error Handling Module for BarberZap
 * Central export of all error-related utilities
 */

// Types
export type {
  AppError,
  ErrorContext,
  ErrorLogEntry,
  ErrorMetrics,
} from './types';

export {
  ErrorCategory,
  ErrorSeverity,
} from './types';

// Custom Errors
export {
  BaseAppError,
  NetworkError,
  TimeoutError,
  ValidationError,
  AuthError,
  TokenExpiredError,
  NotFoundError,
  ConflictError,
  ServerError,
  UnknownError,
  createErrorFromStatus,
  createError,
} from './errors';

// Logger
export {
  errorLogger,
} from './logger';

// Global Error Handler
export {
  handleError,
  initGlobalErrorHandler,
  cleanupGlobalErrorHandler,
  withErrorHandling,
  withSilentErrorHandling,
  registerToast,
  unregisterToast,
} from './globalErrorHandler';

// React Error Boundary
export {
  ErrorBoundary,
  withErrorBoundary,
} from './ErrorBoundary';
