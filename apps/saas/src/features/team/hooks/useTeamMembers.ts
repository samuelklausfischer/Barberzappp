import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/infrastructure/supabase/client';
import { useTenant } from '@/features/auth/hooks/useTenant';
import {
  normalizeTeamMemberDraft,
  validateTeamMemberDraft,
  type TeamMemberDraft,
  type TeamSchedulePeriod,
} from '../utils/teamSchedule';

export type TeamMember = {
  id: string;
  name: string;
  specialties: string[];
  bio: string;
  active: boolean;
  updatedAt: string | null;
  schedule: TeamSchedulePeriod[];
};
type Row = {
  id: string | number;
  name: string | null;
  specialties?: unknown;
  bio?: unknown;
  active: boolean | null;
  status: string | null;
  updated_at?: string | null;
  working_hours?: unknown;
};
type RpcResult = { member?: Row; success?: boolean; code?: string; message?: string } | Row | null;

type ErrorDetails = { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
type WorkingHourRow = {
  day_of_week?: unknown;
  start_time?: unknown;
  end_time?: unknown;
  is_active?: unknown;
};

const errorDetails = (cause: unknown): ErrorDetails =>
  cause instanceof Error
    ? { message: cause.message }
    : typeof cause === 'object' && cause !== null
      ? (cause as ErrorDetails)
      : {};

const safeMessage = (cause: unknown) => {
  const details = errorDetails(cause);
  const code = [details.message, details.details, details.hint, details.code]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toUpperCase();
  if (code.includes('TEAM_MEMBER_SCHEDULE_CONFLICTS_APPOINTMENTS'))
    return 'A jornada conflita com agendamentos futuros. Remarque ou cancele os atendimentos antes de salvar.';
  if (code.includes('TEAM_MEMBER_HAS_UPCOMING_APPOINTMENTS'))
    return 'Não é possível inativar enquanto houver próximos atendimentos. Remarque ou cancele-os primeiro.';
  if (
    code.includes('TEAM_MEMBER_HAS_HISTORY') ||
    code.includes('TEAM_MEMBER_HAS_APPOINTMENTS') ||
    code.includes('TEAM_MEMBER_HAS_SERVICES') ||
    code.includes('TEAM_MEMBER_HAS_CLIENTS')
  )
    return 'Este profissional possui histórico. Use a inativação para preservar os dados.';
  if (code.includes('TEAM_MEMBER_CONFLICT'))
    return 'Este cadastro foi alterado por outra pessoa. Atualize a página e tente novamente.';
  if (code.includes('TEAM_MEMBER_ALREADY_EXISTS') || code.includes('23505'))
    return 'Já existe um profissional com esse nome.';
  if (
    code.includes('TEAM_MEMBER_SCHEDULE') ||
    code.includes('SCHEDULE_INVALID') ||
    code.includes('WORKING_HOURS_OVERLAP')
  )
    return 'Revise a jornada informada antes de salvar.';
  if (
    code.includes('TEAM_MANAGEMENT_FORBIDDEN') ||
    code.includes('TEAM_OWNER_REQUIRED') ||
    code.includes('TENANT_FORBIDDEN') ||
    code.includes('42501')
  )
    return 'Você não tem permissão para gerenciar a equipe.';
  if (
    code.includes('TEAM_MEMBER_NAME_INVALID') ||
    code.includes('TEAM_MEMBER_BIO_INVALID') ||
    code.includes('TEAM_MEMBER_ACTIVE_INVALID') ||
    code.includes('TEAM_MEMBER_ACTIVE_REQUIRED')
  )
    return 'Revise os dados do profissional antes de salvar.';
  if (
    code.includes('TEAM_MEMBER_SPECIALTIES_INVALID') ||
    code.includes('TEAM_MEMBER_SPECIALTIES_DUPLICATE')
  )
    return 'Revise as especialidades informadas.';
  return 'Não foi possível concluir a operação. Tente novamente.';
};
const asArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const validPeriod = (
  item: WorkingHourRow
): item is Required<Pick<WorkingHourRow, 'day_of_week' | 'start_time' | 'end_time'>> &
  WorkingHourRow => {
  const day = Number(item.day_of_week);
  const start = String(item.start_time).slice(0, 5);
  const end = String(item.end_time).slice(0, 5);
  return (
    item.is_active === true &&
    Number.isInteger(day) &&
    day >= 0 &&
    day <= 6 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(start) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(end) &&
    start < end
  );
};
const map = (row: Row): TeamMember => ({
  id: String(row.id),
  name: row.name?.trim() || 'Profissional sem nome',
  specialties: asArray(row.specialties),
  bio: typeof row.bio === 'string' ? row.bio : '',
  active: row.active !== false && row.status !== 'inactive',
  updatedAt: row.updated_at ?? null,
  schedule: Array.isArray(row.working_hours)
    ? row.working_hours
        .filter((item): item is WorkingHourRow => typeof item === 'object' && item !== null)
        .filter(validPeriod)
        .map((item) => ({
          day_of_week: Number(item.day_of_week),
          start_time: String(item.start_time).slice(0, 5),
          end_time: String(item.end_time).slice(0, 5),
        }))
        .sort(
          (first, second) =>
            first.day_of_week - second.day_of_week ||
            first.start_time.localeCompare(second.start_time)
        )
    : [],
});
const memberFrom = (result: RpcResult) =>
  result && typeof result === 'object' && 'member' in result && result.member
    ? map(result.member)
    : result && typeof result === 'object' && 'id' in result
      ? map(result as Row)
      : null;

export const useTeamMembers = () => {
  const { tenantId } = useTenant();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++activeRequest.current;
    if (!tenantId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('barbers')
        .select(
          'id,name,specialties,bio,active,status,updated_at,working_hours!working_hours_barber_id_fkey(day_of_week,start_time,end_time,is_active,timezone)'
        )
        .eq('tenant_id', tenantId)
        .order('name');
      if (queryError) throw queryError;
      if (request === activeRequest.current) setMembers(((data ?? []) as Row[]).map(map));
    } catch (cause) {
      if (request === activeRequest.current) {
        setMembers([]);
        setError(safeMessage(cause));
      }
    } finally {
      if (request === activeRequest.current) setLoading(false);
    }
  }, [tenantId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const call = useCallback(
    async (
      fn: 'save_team_member' | 'set_team_member_active' | 'delete_team_member',
      params: Record<string, unknown>
    ) => {
      if (!tenantId) throw new Error('AUTHENTICATION_REQUIRED');
      const { data, error: rpcError } = await supabase.rpc(fn, params);
      if (rpcError) throw rpcError;
      const response = data as RpcResult;
      if (
        response &&
        typeof response === 'object' &&
        'success' in response &&
        response.success === false
      )
        throw new Error(response.code ?? response.message ?? 'REQUEST_FAILED');
      return response;
    },
    [tenantId]
  );
  const save = useCallback(
    async (id: string | null, draft: TeamMemberDraft, expectedUpdatedAt: string | null) => {
      try {
        const validation = validateTeamMemberDraft(draft);
        if (validation) throw new Error(validation);
        const normalized = normalizeTeamMemberDraft(draft);
        const result = await call('save_team_member', {
          p_tenant_id: tenantId,
          p_barber_id: id,
          p_name: normalized.name,
          p_specialties: normalized.specialties,
          p_bio: normalized.bio,
          p_active: normalized.active,
          p_schedule: normalized.schedule,
          p_expected_updated_at: expectedUpdatedAt,
        });
        const saved = memberFrom(result);
        if (saved)
          setMembers((current) =>
            (id
              ? current.map((member) => (member.id === id ? saved : member))
              : [...current, saved]
            ).sort((a, b) => a.name.localeCompare(b.name))
          );
        else await refresh();
        return saved;
      } catch (cause) {
        throw new Error(safeMessage(cause));
      }
    },
    [call, refresh, tenantId]
  );
  const setActive = useCallback(
    async (member: TeamMember, active: boolean) => {
      try {
        const result = await call('set_team_member_active', {
          p_tenant_id: tenantId,
          p_barber_id: member.id,
          p_active: active,
          p_expected_updated_at: member.updatedAt,
        });
        const saved = memberFrom(result);
        if (saved)
          setMembers((current) =>
            current
              .map((item) => (item.id === member.id ? saved : item))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        else await refresh();
      } catch (cause) {
        throw new Error(safeMessage(cause));
      }
    },
    [call, refresh, tenantId]
  );
  const remove = useCallback(
    async (member: TeamMember) => {
      try {
        await call('delete_team_member', {
          p_tenant_id: tenantId,
          p_barber_id: member.id,
          p_expected_updated_at: member.updatedAt,
        });
        setMembers((current) => current.filter((item) => item.id !== member.id));
      } catch (cause) {
        throw new Error(safeMessage(cause));
      }
    },
    [call, tenantId]
  );
  return { members, loading, error, refresh, save, setActive, remove };
};
