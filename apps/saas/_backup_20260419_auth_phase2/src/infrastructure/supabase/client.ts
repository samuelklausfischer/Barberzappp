/**
 * Supabase Client Configuration
 * 
 * Este arquivo configura o cliente Supabase para uso em toda a aplicação.
 * 
 * Variáveis de ambiente necessárias:
 * - VITE_SUPABASE_URL: URL do projeto Supabase
 * - VITE_SUPABASE_ANON_KEY: Chave pública anônima do Supabase
 * 
 * @example
 * import { supabase } from '@/infrastructure/supabase/client';
 * 
 * const { data, error } = await supabase
 *   .from('appointments')
 *   .select('*');
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================================================
// VALIDAÇÃO
// ============================================================================

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please add it to your .env file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to your .env file.'
  );
}

// ============================================================================
// CLIENT INSTANCE
// ============================================================================

/**
 * Instância única do cliente Supabase
 * Use esta instância em toda a aplicação
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'barberzap-pro'
    }
  }
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export * from '@supabase/supabase-js';

export type { 
  RealtimeChannel,
  RealtimePostgresChangesPayload 
} from '@supabase/supabase-js';
