import React, { useState } from 'react';
import { useClients } from '@/features/clients/hooks/useClients';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, LoadingSkeleton } from '@/components/ui/Skeleton';
import type { Client } from '@/infrastructure/supabase/client';
import {
  EmptyPremium,
  PageHeader,
  Panel,
  SectionTitle,
  StatusBadge,
} from '@/components/ui/Premium';

const ClientsList: React.FC = () => {
  const { clients, loading, error, refresh, createClient, updateClient, deleteClient } =
    useClients();

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', avatar_url: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', email: '', avatar_url: '' });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      avatar_url: client.avatar_url || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      setFormError('Preencha o nome e telefone');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const clientData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        avatar_url: formData.avatar_url || null,
      };

      if (editingClient) {
        await updateClient(editingClient.id, clientData);
      } else {
        await createClient(clientData);
      }

      setShowModal(false);
      setEditingClient(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar cliente');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient(id);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery)
  );

  if (loading) {
    return <LoadingSkeleton count={5} type="list" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Relacionamento premium"
        title={
          <>
            Seus <span className="bz-gold-text">clientes</span> bem cuidados.
          </>
        }
        description="Uma leitura limpa da sua base com busca rápida, histórico elegante e ações de edição sem atrito."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-11 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#1A1A1F] transition-colors hover:bg-[#B99220] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            Novo cliente
          </button>
        }
      />

      <Panel className="p-4 sm:p-5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar clientes por nome ou telefone"
            placeholder="Buscar por nome ou telefone..."
            className="w-full rounded-full border border-[#D1D5DB] bg-white px-12 py-3.5 text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>
      </Panel>

      {filteredClients.length === 0 ? (
        <EmptyPremium
          icon="groups"
          title={searchQuery ? 'Nada encontrado' : 'Base de clientes vazia'}
          description={
            searchQuery
              ? 'Ajuste a busca para encontrar o cliente desejado.'
              : 'Cadastre os primeiros clientes para criar relacionamento, histórico e recorrência de atendimento.'
          }
          action={
            !searchQuery ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="min-h-11 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#1A1A1F] transition-colors hover:bg-[#B99220] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
              >
                Adicionar cliente
              </button>
            ) : undefined
          }
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[#E5E7EB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle
              title="Atelier de clientes"
              subtitle={`${filteredClients.length} cliente(s) visíveis no momento.`}
            />
            <StatusBadge label="CRM leve" tone="gold" />
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="grid gap-4 border-b border-transparent px-5 py-4 lg:grid-cols-[1.35fr_1fr_1fr_156px] lg:items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#F4D06F] bg-[#FFFAEB] text-[#8A6A11]">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#1A1A1F]">{client.name}</p>
                    <p className="text-xs text-[#6B7280]">Cliente da barbearia</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Telefone</p>
                  <p className="text-sm text-[#4B5563]">{client.phone}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Email</p>
                  <p className="text-sm text-[#4B5563]">{client.email || 'Não informado'}</p>
                </div>
                <div className="flex gap-3 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => openEditModal(client)}
                    className="min-h-11 rounded-full border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-semibold text-[#1A1A1F] transition-colors hover:bg-[#F7F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(client.id)}
                    className="min-h-11 rounded-full border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#FFF6F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClient ? 'Editar cliente' : 'Novo cliente'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="bz-kicker mb-3 block">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="Ex: João Silva"
              required
            />
          </div>
          <div>
            <label className="bz-kicker mb-3 block">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="Ex: +5511999999999"
              required
            />
          </div>
          <div>
            <label className="bz-kicker mb-3 block">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
              placeholder="Ex: joao@email.com"
            />
          </div>

          {formError ? (
            <div className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] px-4 py-4 text-sm text-[#B42318]">
              {formError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="min-h-11 rounded-full border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold text-[#4B5563] transition-colors hover:bg-[#F7F8FA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="min-h-11 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#1A1A1F] transition-colors hover:bg-[#B99220] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              {formLoading ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientsList;
