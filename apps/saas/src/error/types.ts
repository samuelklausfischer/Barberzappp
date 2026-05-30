/**
 * Error Types for BarberZap Frontend
 * Categorizes errors for better handling and user feedback
 */

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTH = 'auth',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',        // Non-critical, can be ignored
  MEDIUM = 'medium',  // Affects UX but app still works
  HIGH = 'high',      // Affects critical functionality
  CRITICAL = 'critical', // App cannot continue
}

export interface ErrorContext {
  timestamp: string;
  route: string;
  userId?: string;
  userAgent: string;
  component?: string;
  action?: string;
  additionalData?: Record<string, unknown>;
}

export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  context: ErrorContext;
  recoverable: boolean;
  retryable: boolean;
  userMessage: string;
  recoverySuggestions?: string[];
  originalError?: Error | unknown;
}

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  context: ErrorContext;
  stack?: string;
  recoverable: boolean;
  retryable: boolean;
  recoverySuggestions?: string[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<string, number>;
  recentErrors: ErrorLogEntry[];
}
