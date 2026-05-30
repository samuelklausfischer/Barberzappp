/**
 * Custom Error Classes for BarberZap Frontend
 * Provides typed errors with user-friendly messages and recovery suggestions
 */

import type { AppError } from './types';
import { ErrorCategory, ErrorSeverity } from './types';
import { errorLogger } from './logger';

/**
 * Base class for all app errors
 */
export abstract class BaseAppError extends Error implements AppError {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly context: AppError['context'];
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly recoverySuggestions?: string[];
  public readonly originalError?: Error | unknown;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    options: Partial<AppError> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.message = message;
    this.userMessage = userMessage;
    this.category = category;
    this.severity = severity;
    this.recoverable = options.recoverable ?? true;
    this.retryable = options.retryable ?? false;
    this.recoverySuggestions = options.recoverySuggestions;
    this.originalError = options.originalError;
    this.context = options.context ?? {
      timestamp: new Date().toISOString(),
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Auto-log the error
    errorLogger.log(this);
  }
}

/**
 * Network Error - internet or timeout issues
 */
export class NetworkError extends BaseAppError {
  constructor(
    message: string = 'Network error occurred',
    options: Partial<AppError> = {}
  ) {
    super(
      'NETWORK_ERROR',
      message,
      options.userMessage ?? 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      {
        ...options,
        recoverable: true,
        retryable: true,
        recoverySuggestions: [
          'Verifique sua conexão com a internet',
          'Tente novamente em alguns instantes',
          'Se o problema persistir, entre em contato com o suporte',
        ],
      }
    );
  }
}

/**
 * Timeout Error - request took too long
 */
export class TimeoutError extends BaseAppError {
  constructor(
    timeoutMs: number,
    options: Partial<AppError> = {}
  ) {
    const timeoutSeconds = Math.round(timeoutMs / 1000);
    super(
      'TIMEOUT_ERROR',
      `Request timeout after ${timeoutSeconds}s`,
      options.userMessage ?? `A solicitação demorou muito tempo (${timeoutSeconds}s). Tente novamente.`,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      {
        ...options,
        recoverable: true,
        retryable: true,
        recoverySuggestions: [
          'Tente novamente agora',
          'Se o problema continuar, pode ser uma instabilidade temporária',
        ],
        context: {
          ...options.context,
          additionalData: { ...options.context?.additionalData, timeoutMs },
        },
      }
    );
  }
}

/**
 * Validation Error - invalid input
 */
export class ValidationError extends BaseAppError {
  constructor(
    field?: string,
    message?: string,
    options: Partial<AppError> = {}
  ) {
    const fieldName = field ? `"${field}"` : 'algum campo';
    super(
      'VALIDATION_ERROR',
      message ?? `Validation error for field ${fieldName}`,
      options.userMessage ?? `Verifique os dados digitados no ${fieldName} e tente novamente.`,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      {
        ...options,
        recoverable: true,
        retryable: false,
        recoverySuggestions: [
          'Verifique se todos os campos obrigatórios foram preenchidos',
          'Confirme se os valores estão no formato correto',
        ],
        context: {
          ...options.context,
          additionalData: { ...options.context?.additionalData, field },
        },
      }
    );
  }
}

/**
 * Auth Error - login or permission issues
 */
export class AuthError extends BaseAppError {
  constructor(
    message: string = 'Authentication failed',
    options: Partial<AppError> = {}
  ) {
    super(
      'AUTH_ERROR',
      message,
      options.userMessage ?? 'Você precisa entrar para acessar esta funcionalidade.',
      ErrorCategory.AUTH,
      ErrorSeverity.HIGH,
      {
        ...options,
        recoverable: true,
        retryable: false,
        recoverySuggestions: [
          'Faça login novamente',
          'Se o problema persistir, redefina sua senha',
        ],
      }
    );
  }
}

/**
 * Token Expired Error
 */
export class TokenExpiredError extends AuthError {
  constructor(options: Partial<AppError> = {}) {
    super(
      'Sessão expirada',
      options
    );
    this.code = 'TOKEN_EXPIRED';
    this.userMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
    this.recoverySuggestions = ['Faça login novamente para continuar'];
  }
}

/**
 * Not Found Error - resource not found
 */
export class NotFoundError extends BaseAppError {
  constructor(
    resource: string = 'Recurso',
    options: Partial<AppError> = {}
  ) {
    super(
      'NOT_FOUND',
      `${resource} not found`,
      options.userMessage ?? `O ${resource.toLowerCase()} solicitado não foi encontrado.`,
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.MEDIUM,
      {
        ...options,
        recoverable: true,
        retryable: false,
        recoverySuggestions: [
          'Verifique se o ID ou URL está correto',
          'O recurso pode ter sido removido',
        ],
      }
    );
  }
}

/**
 * Conflict Error - 409, double-booking, etc.
 */
export class ConflictError extends BaseAppError {
  constructor(
    message: string = 'Resource conflict',
    options: Partial<AppError> = {}
  ) {
    super(
      'CONFLICT',
      message,
      options.userMessage ?? 'Este horário já está ocupado. Escolha outro horário.',
      ErrorCategory.CONFLICT,
      ErrorSeverity.MEDIUM,
      {
        ...options,
        recoverable: true,
        retryable: false,
        recoverySuggestions: [
          'Escolha outro horário ou data',
          'Verifique se o agendamento já existe',
        ],
      }
    );
  }
}

/**
 * Server Error - 500 errors
 */
export class ServerError extends BaseAppError {
  constructor(
    message: string = 'Internal server error',
    options: Partial<AppError> = {}
  ) {
    super(
      'SERVER_ERROR',
      message,
      options.userMessage ?? 'Ocorreu um erro no servidor. Tente novamente em alguns instantes.',
      ErrorCategory.SERVER,
      ErrorSeverity.HIGH,
      {
        ...options,
        recoverable: true,
        retryable: true,
        recoverySuggestions: [
          'Tente novamente em alguns instantes',
          'Se o problema persistir, entre em contato com o suporte',
        ],
      }
    );
  }
}

/**
 * Unknown Error - catch-all for unexpected errors
 */
export class UnknownError extends BaseAppError {
  constructor(
    originalError: Error | unknown,
    options: Partial<AppError> = {}
  ) {
    const message = originalError instanceof Error 
      ? originalError.message 
      : 'An unknown error occurred';
    
    super(
      'UNKNOWN_ERROR',
      message,
      options.userMessage ?? 'Ocorreu um erro inesperado. Tente novamente.',
      ErrorCategory.UNKNOWN,
      ErrorSeverity.HIGH,
      {
        ...options,
        recoverable: true,
        retryable: true,
        originalError,
        recoverySuggestions: [
          'Tente recarregar a página',
          'Se o problema continuar, entre em contato com o suporte',
        ],
      }
    );
  }
}

/**
 * Create error from HTTP response status code
 */
export function createErrorFromStatus(
  status: number,
  message?: string,
  options: Partial<AppError> = {}
): BaseAppError {
  switch (status) {
    case 400:
      return new ValidationError(undefined, message, options);
    case 401:
      return new AuthError(message, options);
    case 403:
      return new AuthError('Permission denied', {
        ...options,
        userMessage: 'Você não tem permissão para acessar este recurso.',
      });
    case 404:
      return new NotFoundError('Recurso', { ...options, userMessage: message });
    case 409:
      return new ConflictError(message, options);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, options);
    default:
      return new UnknownError(new Error(message), options);
  }
}

/**
 * Create error from unknown error object
 */
export function createError(error: unknown, context?: Partial<AppError['context']>): BaseAppError {
  if (error instanceof BaseAppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('fetch')) {
      return new NetworkError(error.message, { originalError: error, context });
    }
    if (error.message.includes('timeout')) {
      return new TimeoutError(30000, { originalError: error, context });
    }
    
    return new UnknownError(error, { context });
  }

  return new UnknownError(error, { context });
}
