/**
 * React Error Boundary for BarberZap
 * Catches errors in React component tree and shows user-friendly UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BaseAppError, createError } from './errors';
import { errorLogger } from './logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showMessage?: boolean;
  showDetails?: boolean;
  showReportLink?: boolean;
}

/**
 * Error Boundary Component
 * Wraps component tree to catch and handle React errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to our error logger
    const appError = createError(error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      additionalData: {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
      },
    });

    errorLogger.log(appError);

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private static generateErrorId(): string {
    return `EB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleReportIssue = (): void => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create mailto link with error details
    const subject = encodeURIComponent(`BarberZap Error Report - ${errorId}`);
    const body = encodeURIComponent(`
We encountered an error in BarberZap.

Error ID: ${errorId}

Error Details:
${error?.message}

${error?.stack}

Component Stack:
${errorInfo?.componentStack}

Please describe what you were doing when this occurred:

---
Browser: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim());

    window.open(`mailto:support@barberzap.com?subject=${subject}&body=${body}`);
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, showMessage = true, showDetails = import.meta.env.DEV, showReportLink = true } = this.props;

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback) {
      return fallback;
    }

    // Show default error UI
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50/10 to-orange-50/10 dark:from-red-950/20 dark:to-orange-950/20 p-4"
        role="alert"
        aria-live="polite"
      >
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <svg 
                className="w-10 h-10 opacity-90" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <h1 className="text-2xl font-bold">Ops! Algo deu errado</h1>
            </div>
            {showMessage && (
              <p className="text-white/90 text-sm leading-relaxed">
                Algo inesperado aconteceu. Não se preocupe, não perdemos suas informações.
              </p>
            )}
          </div>

          {/* Error Details (Dev Mode Only) */}
          {showDetails && error && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 border-b border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-red-600 dark:text-red-400">
                  Error ID: {errorId}
                </span>
                <span className="text-xs text-red-500 dark:text-red-400 font-mono">
                  {error.name}
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto">
                <p className="text-xs text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 whitespace-pre-wrap overflow-x-auto">
                      {error.stack}
                    </pre>
                  </details>
                )}
                {errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-red-600 dark:text-red-400 mt-2 whitespace-pre-wrap overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Error Message (Production) */}
          {!showDetails && showMessage && (
            <div className="p-6 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Estamos trabalhando para resolver este problema. Você pode tentar novamente ou voltar à tela inicial.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 space-y-3 bg-zinc-50 dark:bg-zinc-800/50">
            <button
              onClick={this.handleReset}
              className="w-full bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-700 dark:to-zinc-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-zinc-800 hover:to-zinc-600 dark:hover:from-zinc-600 dark:hover:to-zinc-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tentar novamente
            </button>

            <div className="flex gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium py-2.5 px-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors border border-zinc-200 dark:border-zinc-600"
              >
                Voltar ao início
              </button>

              {showReportLink && (
                <button
                  onClick={this.handleReportIssue}
                  className="flex-1 bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium py-2.5 px-4 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors border border-zinc-200 dark:border-zinc-600 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reportar
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-zinc-100 dark:bg-zinc-900/50 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Error ID: {errorId}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * HOC to wrap any component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
