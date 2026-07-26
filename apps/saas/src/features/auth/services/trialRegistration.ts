import { supabase } from '@/infrastructure/supabase/client';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
export type TrialRegistrationPayload = {
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  terms_accepted: boolean;
  website: string;
};
type TrialRegistrationResponse = {
  success: true;
  requires_email_confirmation: boolean;
  message: string;
};
type TrialErrorPayload = {
  code?: unknown;
  error?: unknown;
};

const MESSAGE_BY_CODE: Readonly<Record<string, string>> = {
  trial_cpf_already_used: 'Este CPF já utilizou o período de teste.',
  trial_invalid_payload: 'Confira os dados informados e tente novamente.',
  trial_rate_limited: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  trial_registration_conflict:
    'Não foi possível ativar o teste com estes dados. Se você já possui uma conta, entre para continuar.',
  trial_temporarily_unavailable:
    'Não foi possível criar sua conta agora. Tente novamente em alguns instantes.',
};

const MESSAGE_BY_PUBLIC_ERROR: Readonly<Record<string, string>> = {
  'voce precisa aceitar os termos para criar um teste.':
    'Você precisa aceitar os termos para criar o teste.',
  'verifique os dados informados.': 'Confira os dados informados e tente novamente.',
  'nao foi possivel iniciar um teste com estes dados.':
    'Não foi possível ativar o teste com estes dados. Se você já possui uma conta, entre para continuar.',
  'cadastro temporariamente indisponivel.':
    'Não foi possível criar sua conta agora. Tente novamente em alguns instantes.',
};

const messageFromHttpError = async (error: FunctionsHttpError): Promise<string | null> => {
  try {
    const payload: unknown = await error.context.json();
    if (!payload || typeof payload !== 'object') return null;

    const { code, error: publicError } = payload as TrialErrorPayload;
    if (typeof code === 'string' && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code];

    if (typeof publicError === 'string') {
      return MESSAGE_BY_PUBLIC_ERROR[publicError.trim().toLowerCase()] ?? null;
    }
  } catch {
    return null;
  }

  return null;
};

const messageFor = async (error: unknown): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    const publicMessage = await messageFromHttpError(error);
    if (publicMessage) return publicMessage;
  }

  if (error instanceof FunctionsFetchError) {
    return 'Não foi possível conectar ao cadastro. Verifique sua internet e tente novamente.';
  }

  if (error instanceof FunctionsRelayError) {
    return 'O serviço de cadastro está temporariamente indisponível. Tente novamente em alguns instantes.';
  }

  const text = error instanceof Error ? error.message.toLowerCase() : '';
  if (text.includes('cpf') && (text.includes('already') || text.includes('used')))
    return 'Este CPF já utilizou o período de teste.';
  if (text.includes('email') && (text.includes('already') || text.includes('exists')))
    return 'Este e-mail já possui uma conta. Entre para continuar.';
  if (text.includes('rate') || text.includes('too many'))
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  return 'Não foi possível criar sua conta agora. Tente novamente em alguns instantes.';
};
/** O contrato da Edge Function usa snake_case para espelhar o payload do servidor. */
export const registerTrial = async (
  payload: TrialRegistrationPayload
): Promise<TrialRegistrationResponse> => {
  const { data, error } = await supabase.functions.invoke<TrialRegistrationResponse>(
    'register-trial',
    { body: payload }
  );
  if (error) throw new Error(await messageFor(error));
  if (!data?.success) throw new Error('O cadastro retornou uma resposta inválida. Tente novamente.');
  return data;
};
