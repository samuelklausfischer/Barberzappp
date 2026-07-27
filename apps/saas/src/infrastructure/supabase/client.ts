import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseApiKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseApiKey) {
  throw new Error(
    'Supabase configuration is missing. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseApiKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          tenant_id: string | null;
          remote_jid: string | null;
          client_name: string | null;
          service_type: string | null;
          start_time: string | null;
          status: string | null;
          created_at: string | null;
          barber_id: string | null;
          client_id: string | null;
          service_id: string | null;
          price: number | null;
          observation: string | null;
          date: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          remote_jid?: string | null;
          client_name?: string | null;
          service_type?: string | null;
          start_time?: string | null;
          status?: string | null;
          created_at?: string | null;
          barber_id?: string | null;
          client_id?: string | null;
          service_id?: string | null;
          price?: number | null;
          observation?: string | null;
          date?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          remote_jid?: string | null;
          client_name?: string | null;
          service_type?: string | null;
          start_time?: string | null;
          status?: string | null;
          created_at?: string | null;
          barber_id?: string | null;
          client_id?: string | null;
          service_id?: string | null;
          price?: number | null;
          observation?: string | null;
          date?: string | null;
        };
      };
      services: {
        Row: {
          id: string;
          tenant_id: string | null;
          name: string | null;
          price: number | null;
          duration_minutes: number | null;
          barber_id: string | null;
          active: boolean | null;
          description: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          name?: string | null;
          price?: number | null;
          duration_minutes?: number | null;
          barber_id?: string | null;
          active?: boolean | null;
          description?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          name?: string | null;
          price?: number | null;
          duration_minutes?: number | null;
          barber_id?: string | null;
          active?: boolean | null;
          description?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
      };
      clients: {
        Row: {
          id: string;
          barber_id: string | null;
          name: string | null;
          phone: string | null;
          avatar_url: string | null;
          email: string | null;
        };
        Insert: {
          id?: string;
          barber_id?: string | null;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          barber_id?: string | null;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
        };
      };
      barbers: {
        Row: {
          id: string;
          tenant_id: string | null;
          name: string | null;
          active: boolean | null;
          created_at: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          name?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          name?: string | null;
          active?: boolean | null;
          created_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
      };
      tenants: {
        Row: {
          id: string;
          email: string | null;
          company_name: string | null;
          owner_phone: string | null;
          subscription_status: string | null;
          subscription_id: string | null;
          created_at: string | null;
          is_active: boolean | null;
          owner_email: string | null;
          prompt_tone: string | null;
          prompt_business_rules: string | null;
          business_hours: unknown | null;
          whatsapp_status: string | null;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          timezone: string | null;
          booking_interval_minutes: number;
        };
        Insert: {
          id?: string;
          email?: string | null;
          company_name?: string | null;
          owner_phone?: string | null;
          subscription_status?: string | null;
          subscription_id?: string | null;
          created_at?: string | null;
          is_active?: boolean | null;
          owner_email?: string | null;
          prompt_tone?: string | null;
          prompt_business_rules?: string | null;
          business_hours?: unknown | null;
          whatsapp_status?: string | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          timezone?: string | null;
          booking_interval_minutes?: number;
        };
        Update: {
          id?: string;
          email?: string | null;
          company_name?: string | null;
          owner_phone?: string | null;
          subscription_status?: string | null;
          subscription_id?: string | null;
          created_at?: string | null;
          is_active?: boolean | null;
          owner_email?: string | null;
          prompt_tone?: string | null;
          prompt_business_rules?: string | null;
          business_hours?: unknown | null;
          whatsapp_status?: string | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          timezone?: string | null;
          booking_interval_minutes?: number;
        };
      };
      agente_config: {
        Row: {
          id: number;
          tenant_id: string;
          shop_id: string;
          user_id: string;
          barber_name: string;
          nome_barbearia: string | null;
          name: string | null;
          endereco: string | null;
          address: string | null;
          horarios: string | null;
          horario_funcionamento: string | null;
          hours: string | null;
          nome_ia: string;
          ai_name: string | null;
          saudacao: string | null;
          greeting: string | null;
          instructions: string | null;
          phone: string | null;
          whatsapp: string | null;
          email: string | null;
          status: string;
          ai_enabled: boolean;
          language: string | null;
          timezone: string | null;
          model: string | null;
          temperature: number | null;
          metadata: unknown;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          tenant_id: string;
          shop_id: string;
          user_id: string;
          barber_name: string;
          nome_ia: string;
          nome_barbearia?: string | null;
          name?: string | null;
          endereco?: string | null;
          address?: string | null;
          horarios?: string | null;
          horario_funcionamento?: string | null;
          hours?: string | null;
          ai_name?: string | null;
          saudacao?: string | null;
          greeting?: string | null;
          instructions?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          status?: string;
          ai_enabled?: boolean;
          language?: string | null;
          timezone?: string | null;
          model?: string | null;
          temperature?: number | null;
          metadata?: unknown;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          nome_ia?: string;
          nome_barbearia?: string | null;
          name?: string | null;
          endereco?: string | null;
          address?: string | null;
          horarios?: string | null;
          horario_funcionamento?: string | null;
          hours?: string | null;
          ai_name?: string | null;
          saudacao?: string | null;
          greeting?: string | null;
          instructions?: string | null;
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
          metadata?: unknown;
          updated_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          barbershop_name: string | null;
          full_name: string | null;
          phone: string | null;
          updated_at: string | null;
          ai_assistant_name: string | null;
          business_address: string | null;
          business_hours: string | null;
          subscription_status: string | null;
        };
        Insert: {
          id: string;
          barbershop_name?: string | null;
          full_name?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          ai_assistant_name?: string | null;
          business_address?: string | null;
          business_hours?: string | null;
          subscription_status?: string | null;
        };
        Update: {
          id?: string;
          barbershop_name?: string | null;
          full_name?: string | null;
          phone?: string | null;
          updated_at?: string | null;
          ai_assistant_name?: string | null;
          business_address?: string | null;
          business_hours?: string | null;
          subscription_status?: string | null;
        };
      };
      crm_leads: {
        Row: {
          id: string;
          tenant_id: string;
          client_phone: string;
          client_name: string | null;
          kanban_stage: string | null;
          ai_enabled: boolean | null;
          tags: unknown | null;
          notes: string | null;
          last_message_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          client_phone: string;
          client_name?: string | null;
          kanban_stage?: string | null;
          ai_enabled?: boolean | null;
          tags?: unknown | null;
          notes?: string | null;
          last_message_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          client_phone?: string;
          client_name?: string | null;
          kanban_stage?: string | null;
          ai_enabled?: boolean | null;
          tags?: unknown | null;
          notes?: string | null;
          last_message_at?: string | null;
          created_at?: string | null;
        };
      };
      chat_memory: {
        Row: {
          id: string;
          tenant_id: string | null;
          remote_jid: string;
          message_role: string;
          message_content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          remote_jid: string;
          message_role: string;
          message_content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          remote_jid?: string;
          message_role?: string;
          message_content?: string;
          created_at?: string | null;
        };
      };
      whatsapp_connections: {
        Row: {
          id: string;
          tenant_id: string | null;
          instance_name: string;
          display_name: string;
          phone_number: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          instance_name: string;
          display_name: string;
          phone_number?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          instance_name?: string;
          display_name?: string;
          phone_number?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
  };
};

export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Barber = Database['public']['Tables']['barbers']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type CrmLead = Database['public']['Tables']['crm_leads']['Row'];
export type ChatMemory = Database['public']['Tables']['chat_memory']['Row'];
export type WhatsAppConnection = Database['public']['Tables']['whatsapp_connections']['Row'];
