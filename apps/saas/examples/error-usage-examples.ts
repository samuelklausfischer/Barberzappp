/**
 * BarberZap - Error Handler Usage Examples (Frontend)
 * 
 * Este arquivo demonstra como usar o sistema de error handling
 * em diferentes situações comuns no frontend.
 */

import {
  // Errors
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

  // Handlers
  handleError,
  withErrorHandling,
  withSilentErrorHandling,

  // Logger
  errorLogger,

  // Error Boundary
  ErrorBoundary,
  withErrorBoundary,
} from '@/error';

// ============================================================================
// EXEMPLO 1: Fetch API com Error Handling
// ============================================================================

async function fetchAppointments(shopId: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/shops/${shopId}/appointments`);
    
    if (!response.ok) {
      // Cria erro apropriado baseado no status code
      const error = createErrorFromStatus(response.status, 'Failed to fetch appointments', {
        component: 'Agenda',
        action: 'fetchAppointments',
        additionalData: { shopId },
      });
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    // Se já é um erro nosso, re-throw
    if (error instanceof NetworkError ||
        error instanceof TimeoutError ||
        error instanceof ServerError) {
      throw error;
    }
    // Caso contrário, converte
    throw createError(error, { component: 'Agenda', action: 'fetchAppointments' });
  }
}

// ============================================================================
// EXEMPLO 2: Handler de Login com Auth Errors
// ============================================================================

interface LoginData {
  email: string;
  password: string;
}

async function login(data: LoginData): Promise<{ token: string }> {
  // Validação local
  if (!data.email || !data.email.includes('@')) {
    throw new ValidationError('email', 'Email inválido', {
      component: 'Login',
      action: 'submit',
      userMessage: 'Por favor, insira um email válido',
    });
  }

  if (!data.password || data.password.length < 6) {
    throw new ValidationError('password', 'Senha muito curta', {
      component: 'Login',
      action: 'submit',
      userMessage: 'A senha deve ter pelo menos 6 caracteres',
    });
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthError('Credenciais inválidas');
      }
      throw createErrorFromStatus(response.status, 'Login failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof AuthError) {
      // Auth error já tem user message apropriada
      throw error;
    }
    throw createError(error, { component: 'Login', action: 'submit' });
  }
}

// ============================================================================
// EXEMPLO 3: Criar Agendamento com Conflict Detection
// ============================================================================

interface AppointmentData {
  shopId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  clientName: string;
}

async function createAppointment(data: AppointmentData): Promise<any> {
  // Validações
  const errors: string[] = [];

  if (!data.shopId) {
    errors.push('Selecione a barbearia');
  }
  if (!data.serviceId) {
    errors.push('Selecione o serviço');
  }
  if (!data.startTime) {
    errors.push('Selecione o horário de início');
  }
  if (!data.clientName || data.clientName.trim().length < 3) {
    errors.push('Informe o nome completo do cliente');
  }

  if (errors.length > 0) {
    throw new ValidationError(undefined, errors.join('; '), {
      component: 'CreateAppointment',
      action: 'submit',
      userMessage: 'Verifique os campos obrigatórios',
    });
  }

  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.status === 409) {
      // Conflito - horário já ocupado
      const errorData = await response.json().catch(() => ({}));
      throw new ConflictError('Horário já está ocupado', {
        component: 'CreateAppointment',
        action: 'submit',
        userMessage: 'Este horário já está reservado. Por favor, escolha outro.',
        recoverySuggestions: [
          'Escolha um horário diferente',
          'Verifique o calendário de disponibilidade',
        ],
      });
    }

    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      throw new ValidationError(undefined, errorData.message || 'Dados inválidos', {
        component: 'CreateAppointment',
        action: 'submit',
      });
    }

    if (!response.ok) {
      throw createErrorFromStatus(response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ConflictError) {
      throw error; // Já tem user message apropriada
    }
    throw createError(error, { component: 'CreateAppointment', action: 'submit' });
  }
}

// ============================================================================
// EXEMPLO 4: Fetch com Timeout e Retry
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3
): Promise<T> {
  const fetchFn = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw createErrorFromStatus(response.status);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(10000, {
          component: 'Network',
          action: 'fetch',
        });
      }
      
      throw createError(error);
    }
  };

  const safeFetch = withErrorHandling(fetchFn);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await safeFetch();
      return result;
    } catch (error) {
      if (!(error instanceof NetworkError || error instanceof TimeoutError)) {
        throw error; // Don't retry non-network errors
      }

      if (i === maxRetries - 1) {
        throw error; // Last attempt failed
      }

      // Exponential backoff
      await delay(1000 * Math.pow(2, i));
    }
  }

  throw new NetworkError('Max retries exceeded');
}

// ============================================================================
// EXEMPLO 5: Component React com Error Boundary
// ============================================================================

import React, { useState, useEffect } from 'react';

interface AppointmentListProps {
  shopId: string;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ shopId }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [shopId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAppointments(shopId);
      setAppointments(data);
    } catch (err) {
      setError(err as Error);
      handleError(err, {
        component: 'AppointmentList',
        action: 'loadAppointments',
        additionalData: { shopId },
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler para conflitos específicos
  const handleConflictError = () => {
    if (error instanceof ConflictError) {
      // UI específica para conflito
      return (
        <div className="warning-box">
          <p>⚠️ {error.userMessage}</p>
          <button onClick={loadAppointments}>Tentar outro horário</button>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div>Carregando...</div>;
  if (error) {
    return handleConflictError() || (
      <div className="error-box">
        <p>Ocorreu um erro ao carregar os agendamentos.</p>
        <button onClick={loadAppointments}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="appointment-list">
      {appointments.map(apt => (
        <div key={apt.id} className="appointment-card">
          <p>{apt.clientName}</p>
          <p>{new Date(apt.startTime).toLocaleString('pt-BR')}</p>
        </div>
      ))}
    </div>
  );
};

// Wrapper com Error Boundary
const SafeAppointmentList = withErrorBoundary(AppointmentList, {
  showErrorDetails: import.meta.env.DEV,
  showReportLink: true,
  onError: (error, errorInfo) => {
    console.error('AppointmentList Error:', error, errorInfo);
  },
});

// ============================================================================
// EXEMPLO 6: Silent Error Handling para Features Não-Críticas
// ============================================================================

// Carregar estatísticas - não deve quebrar o app se falhar
async function loadDashboardStats(): Promise<any | undefined> {
  const safeFetch = withSilentErrorHandling(
    async () => {
      const response = await fetch('/api/stats/dashboard');
      if (!response.ok) {
        throw createErrorFromStatus(response.status);
      }
      return await response.json();
    },
    { component: 'Dashboard', action: 'loadStats' }
  );

  return await safeFetch();
}

// No componente:
// const stats = await loadDashboardStats();
// if (stats) { renderStats(stats) } else { showPlaceholder() }

// ============================================================================
// EXEMPLO 7: Custom Error para Pagamentos
// ============================================================================

import { BaseAppError, ErrorCategory, ErrorSeverity } from '@/error';

class PaymentError extends BaseAppError {
  constructor(
    message: string,
    userDetails?: { cardLast4?: string; amount?: number }
  ) {
    super(
      'PAYMENT_ERROR',
      message,
      'Não foi possível processar o pagamento. Tente novamente ou use outro método.',
      ErrorCategory.SERVER,
      ErrorSeverity.HIGH,
      {
        recoverable: true,
        retryable: true,
        recoverySuggestions: [
          'Verifique os dados do cartão',
          'Tente outro método de pagamento',
          'Se o erro persistir, entre em contato com o banco',
        ],
        context: {
          additionalData: {
            ...userDetails,
            // Sanitizar card - não logar número completo
            cardLast4: userDetails?.cardLast4,
          },
        },
      }
    );
  }
}

async function processPayment(amount: number, cardData: any): Promise<any> {
  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, cardData }),
    });

    if (response.status === 402) {
      const errorData = await response.json().catch(() => ({}));
      throw new PaymentError(
        errorData.message || 'Pagamento recusado',
        { cardLast4: cardData.number?.slice(-4), amount }
      );
    }

    if (!response.ok) {
      throw createErrorFromStatus(response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }
    throw createError(error, { component: 'Payment', action: 'process' });
  }
}

// ============================================================================
// EXEMPLO 8: Access Error Metrics para Debugging
// ============================================================================

function showErrorMetrics() {
  const metrics = errorLogger.getMetrics();
  
  console.group('📊 Error Metrics');
  console.log(`Total Errors: ${metrics.totalErrors}`);
  console.log('By Category:', metrics.errorsByCategory);
  console.log('By Severity:', metrics.errorsBySeverity);
  console.log('By Code:', metrics.errorsByCode);
  console.log('Recent Errors:', metrics.recentErrors);
  console.groupEnd();
}

// Expor para console em dev
if (import.meta.env.DEV) {
  (window as any).showErrorMetrics = showErrorMetrics;
  (window as any).errorLogger = errorLogger;
}

// ============================================================================
// EXEMPLO 9: Integrar com Toast/Notification System
// ============================================================================

// No seu setup principal (App.tsx ou onde configura notificações):
import { registerToast } from '@/error';
import { toast } from 'sonner'; // ou react-hot-toast, etc.

registerToast((message, type) => {
  toast[type === 'warning' ? 'warning' : 'error'](message, {
    duration: 5000,
    position: 'top-center',
  });
});

// Agora erros serão automaticamente notificados ao usuário
// (exceto severity=low que são silenciosos)

// ============================================================================
// EXEMPLO 10: Multiple Error Types API Wrapper
// ============================================================================

class BarberZapAPI {
  async get(url: string, signal?: AbortSignal) {
    return this.request(url, { method: 'GET', signal });
  }

  async post(url: string, data: any) {
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async put(url: string, data: any) {
    return this.request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async delete(url: string) {
    return this.request(url, { method: 'DELETE' });
  }

  private async request(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Token expired - trigger refresh
      throw new TokenExpiredError('Sua sessão expirou');
    }

    if (response.status === 403) {
      // Authorization error
      throw createErrorFromStatus(403, 'Acesso não autorizado');
    }

    if (response.status === 404) {
      throw new NotFoundError('Recurso não encontrado');
    }

    if (response.status === 409) {
      throw createErrorFromStatus(409, 'Conflito de dados');
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ServerError('Erro no servidor');
      }
      throw createErrorFromStatus(response.status, 'Erro na requisição');
    }

    return response.json();
  }
}

export const api = new BarberZapAPI();

// ============================================================================
// EXEMPLO 11: Offline Detection com NetworkError
// ============================================================================

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success('Conexão restaurada');
    };

    const handleOffline = () => {
      setOnline(false);
      toast.warning('Sem conexão com a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}

// Uso em componente:
// const isOnline = useOnlineStatus();
// if (!isOnline) return <OfflineMessage />;

// ============================================================================
// EXEMPLO 12: Error Recovery UI
// ============================================================================

interface ErrorRecoveryProps {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({ error, onRetry, onDismiss }) => {
  const getIcon = () => {
    if (error instanceof ValidationError) return '⚠️';
    if (error instanceof NetworkError) return '🌐';
    if (error instanceof AuthError) return '🔐';
    if (error instanceof ConflictError) return '⚡';
    return '❌';
  };

  const getTitle = () => {
    if (error instanceof ValidationError) return 'Verifique os dados';
    if (error instanceof NetworkError) return 'Problema de conexão';
    if (error instanceof AuthError) return 'Erro de autenticação';
    if (error instanceof ConflictError) return 'Conflito detectado';
    return 'Ocorreu um erro';
  };

  const getRecoveryActions = () => {
    const actions = [];

    if (!(error instanceof ValidationError)) {
      actions.push(
        <button
          key="retry"
          onClick={onRetry}
          className="btn btn-primary"
        >
          Tentar novamente
        </button>
      );
    }

    actions.push(
      <button
        key="dismiss"
        onClick={onDismiss}
        className="btn btn-secondary"
      >
        Fechar
      </button>
    );

    return actions;
  };

  return (
    <div className="error-recovery">
      <div className="error-icon">{getIcon()}</div>
      <div className="error-title">{getTitle()}</div>
      <div className="error-message">{error.message}</div>
      
      {error instanceof BaseAppError && error.recoverySuggestions && (
        <div className="recovery-suggestions">
          <p>Sugestões:</p>
          <ul>
            {error.recoverySuggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="error-actions">
        {getRecoveryActions()}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export {
  fetchAppointments,
  login,
  createAppointment,
  fetchWithRetry,
  AppointmentList,
  SafeAppointmentList,
  loadDashboardStats,
  processPayment,
  PaymentError,
  BarberZapAPI,
  api,
  useOnlineStatus,
  ErrorRecovery,
};
