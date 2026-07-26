import { useCallback, useEffect, useRef, useState } from 'react';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { supabase } from '@/infrastructure/supabase/client';
import type { ActiveBarber, Service } from '../types';
import { normalizeServiceDraft, type ServiceDraft } from '../utils/serviceDraft';

type Relation = { name?: unknown } | { name?: unknown }[] | null;
type ServiceRow = {
  id: string | number;
  name: string | null;
  description: string | null;
  price: number | string | null;
  duration: number | null;
  duration_minutes: number | null;
  active: boolean | null;
  status: string | null;
  barber_id: string | number | null;
  barbers: Relation;
};
type BarberRow = {
  id: string | number;
  name: string | null;
  active: boolean | null;
  status: string | null;
};
type CreateServiceRow = {
  id: string | number;
  name: string | null;
  description: string | null;
  price: number | string | null;
  duration_minutes: number | null;
  active: boolean | null;
  status: string | null;
  barber_id: string | number | null;
};
type CreateServiceResult = {
  success?: boolean;
  service?: CreateServiceRow;
  code?: string;
  message?: string;
} | null;
type ErrorLike = { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
const isErrorLike = (value: unknown): value is ErrorLike =>
  typeof value === 'object' && value !== null;
const duration = (minutes: number | null, legacy: number | null) =>
  minutes !== null && minutes > 0 ? minutes : legacy !== null && legacy > 0 ? legacy : 0;
const relationName = (relation: Relation) => {
  const barber = Array.isArray(relation) ? relation[0] : relation;
  return typeof barber?.name === 'string' ? barber.name : null;
};
const mapService = (row: ServiceRow): Service => ({
  id: String(row.id),
  name: row.name || 'Serviço sem nome',
  description: row.description || 'Sem descrição',
  price: Number(row.price) || 0,
  duration: duration(row.duration_minutes, row.duration),
  popular: false,
  icon: 'content_cut',
  active: row.active ?? true,
  status: row.status,
  barberId: row.barber_id === null ? null : String(row.barber_id),
  barberName: relationName(row.barbers),
});
const mapCreatedService = (row: CreateServiceRow, barbers: ActiveBarber[]): Service => {
  const barberId = row.barber_id === null ? null : String(row.barber_id);
  return {
    id: String(row.id),
    name: row.name || 'Serviço sem nome',
    description: row.description || 'Sem descrição',
    price: Number(row.price) || 0,
    duration: duration(row.duration_minutes, null),
    popular: false,
    icon: 'content_cut',
    active: row.active ?? true,
    status: row.status,
    barberId,
    barberName:
      barberId === null ? null : (barbers.find((barber) => barber.id === barberId)?.name ?? null),
  };
};
const sortServices = (services: Service[]) =>
  [...services].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
const mapCreateError = (cause: unknown) => {
  const values =
    cause instanceof Error
      ? [cause.message]
      : isErrorLike(cause)
        ? [cause.message, cause.details, cause.hint, cause.code].filter(
            (value): value is string => typeof value === 'string'
          )
        : [String(cause ?? '')];
  const code = values.join(' ').toUpperCase();
  if (code.includes('SERVICE_ALREADY_EXISTS')) return 'Já existe um serviço com este nome.';
  if (code.includes('SERVICE_NAME_INVALID')) return 'Informe um nome válido para o serviço.';
  if (code.includes('SERVICE_DESCRIPTION_INVALID')) return 'A descrição é longa demais.';
  if (code.includes('SERVICE_DURATION_INVALID')) return 'Informe uma duração válida.';
  if (code.includes('SERVICE_PRICE_INVALID')) return 'Informe um preço válido.';
  if (code.includes('BARBER_NOT_FOUND')) return 'O barbeiro selecionado não está disponível.';
  if (code.includes('TENANT_ACCESS_DENIED') || code.includes('AUTHENTICATION_REQUIRED'))
    return 'Você não tem permissão para criar este serviço.';
  return 'Não foi possível criar o serviço. Tente novamente.';
};

export const useServices = () => {
  const { tenantId } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<ActiveBarber[]>([]);
  const [loading, setLoading] = useState(true);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barbersError, setBarbersError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const creatingRef = useRef(false);
  const fetchServices = useCallback(async () => {
    if (!tenantId) {
      setServices([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('services')
        .select(
          'id, name, description, price, duration, duration_minutes, active, status, barber_id, barbers:barbers!services_barber_id_fkey(name)'
        )
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setServices(((data ?? []) as unknown as ServiceRow[]).map(mapService));
    } catch (cause) {
      setServices([]);
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);
  const fetchBarbers = useCallback(async () => {
    if (!tenantId) {
      setBarbers([]);
      return;
    }
    try {
      setBarbersLoading(true);
      setBarbersError(null);
      const { data, error: fetchError } = await supabase
        .from('barbers')
        .select('id, name, active, status')
        .eq('tenant_id', tenantId)
        .or('active.is.null,active.eq.true')
        .order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setBarbers(
        ((data ?? []) as BarberRow[])
          .filter((barber) => barber.status === null || barber.status === 'active')
          .map((barber) => ({ id: String(barber.id), name: barber.name ?? 'Barbeiro sem nome' }))
      );
    } catch {
      setBarbersError(
        'Não foi possível carregar os barbeiros. Você ainda pode criar um serviço para todos.'
      );
    } finally {
      setBarbersLoading(false);
    }
  }, [tenantId]);
  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);
  const createService = useCallback(
    async (draft: ServiceDraft) => {
      if (!tenantId) {
        const message = 'Barbearia não identificada.';
        setCreateError(message);
        throw new Error(message);
      }
      if (creatingRef.current) return false;
      creatingRef.current = true;
      setCreating(true);
      setCreateError(null);
      const service = normalizeServiceDraft(draft);
      try {
        const { data, error: rpcError } = await supabase.rpc('create_service', {
          p_tenant_id: tenantId,
          p_name: service.name,
          p_description: service.description || null,
          p_duration_minutes: service.durationMinutes,
          p_price: service.price,
          p_barber_id: service.barberId === null ? null : Number(service.barberId),
          p_active: service.active,
        });
        if (rpcError) throw rpcError;
        const result = data as CreateServiceResult;
        if (!result?.success || !result.service)
          throw new Error(result?.code ?? result?.message ?? 'CREATE_SERVICE_FAILED');
        const createdService = mapCreatedService(result.service, barbers);
        setServices((current) =>
          sortServices([
            ...current.filter((candidate) => candidate.id !== createdService.id),
            createdService,
          ])
        );
        return true;
      } catch (cause) {
        const message = mapCreateError(cause);
        setCreateError(message);
        throw new Error(message);
      } finally {
        creatingRef.current = false;
        setCreating(false);
      }
    },
    [barbers, tenantId]
  );
  return {
    services,
    barbers,
    loading,
    barbersLoading,
    creating,
    error,
    barbersError,
    createError,
    refresh: fetchServices,
    fetchBarbers,
    clearCreateError: () => setCreateError(null),
    createService,
  };
};
