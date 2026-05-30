import React, { useState } from 'react';
import { useClients } from '@/features/clients/hooks/useClients';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, LoadingSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Client } from '@/infrastructure/supabase/client';
import { EmptyPremium, PageHeader, Panel, SectionTitle, StatusBadge } from '@/components/ui/Premium';

const ClientsList: React.FC = () => {
  const { clients, loading, error, refresh, createClient, updateClient, deleteClient } = useClients();
  const { user } = useAuth();

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
    setFormData({ name: client.name || '', phone: client.phone || '', email: client.email || '', avatar_url: client.avatar_url || '' });
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
        barber_id: user?.id,
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
    (client) => client.name?.toLowerCase().includes(searchQuery.toLowerCase()) || client.phone?.includes(searchQuery),
  );

  if (loading) {
    return <LoadingSkeleton count={5} type="list" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        eyebrow="Relacionamento premium"
        title={
          <>
            Seus <span className="bz-gold-text">clientes</span> bem cuidados.
          </>
        }
        description="Uma leitura limpa da sua base com busca rápida, histórico elegante e ações de edição sem atrito."
        actions={
          <button onClick={openCreateModal} className="bz-btn-primary rounded-full px-6 py-3 text-sm uppercase tracking-[0.16em]">
            Novo cliente
          </button>
        }
      />

      <Panel className="p-4 sm:p-5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8d8373]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="bz-input rounded-full px-12 py-4"
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
          action={!searchQuery ? <button onClick={openCreateModal} className="bz-btn-primary rounded-full px-6 py-3 text-sm uppercase tracking-[0.16em]">Adicionar cliente</button> : undefined}
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
            <SectionTitle title="Atelier de clientes" subtitle={`${filteredClients.length} cliente(s) visíveis no momento.`} />
            <StatusBadge label="CRM leve" tone="gold" />
          </div>

          <div className="divide-y divide-white/6">
            {filteredClients.map((client) => (
              <div key={client.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.35fr_1fr_1fr_156px] lg:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d7ab3f]/15 bg-[#d7ab3f]/10 text-[#f0d57e]">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">{client.name}</p>
                    <p className="text-xs text-[#938674]">Cliente da barbearia</p>
                  </div>
                </div>
                <div>
                  <p className="bz-kicker mb-2">Telefone</p>
                  <p className="text-sm text-[#d8cdbd]">{client.phone}</p>
                </div>
                <div>
                  <p className="bz-kicker mb-2">Email</p>
                  <p className="text-sm text-[#d8cdbd]">{client.email || 'Não informado'}</p>
                </div>
                <div className="flex gap-3 lg:justify-end">
                  <button onClick={() => openEditModal(client)} className="bz-btn-secondary rounded-full px-4 py-3 text-sm font-semibold hover:bg-white/[0.06]">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="rounded-full border border-[#c97878]/20 bg-[#c97878]/10 px-4 py-3 text-sm font-semibold text-[#f1bcbc] transition-colors hover:bg-[#c97878]/16">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingClient ? 'Editar cliente' : 'Novo cliente'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="bz-kicker mb-3 block">Nome</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bz-input px-4 py-3" placeholder="Ex: João Silva" required />
          </div>
          <div>
            <label className="bz-kicker mb-3 block">Telefone</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bz-input px-4 py-3" placeholder="Ex: +5511999999999" required />
          </div>
          <div>
            <label className="bz-kicker mb-3 block">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bz-input px-4 py-3" placeholder="Ex: joao@email.com" />
          </div>

          {formError ? <div className="rounded-2xl border border-[#c97878]/25 bg-[#c97878]/10 px-4 py-4 text-sm text-[#f1bcbc]">{formError}</div> : null}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="bz-btn-secondary rounded-full px-5 py-3 text-sm font-semibold hover:bg-white/[0.05]">
              Cancelar
            </button>
            <button type="submit" disabled={formLoading} className="bz-btn-primary rounded-full px-5 py-3 text-sm uppercase tracking-[0.16em] disabled:opacity-50">
              {formLoading ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Criar cliente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientsList;
