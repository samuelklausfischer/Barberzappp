import React from 'react';
import { useWhatsAppConnections } from '@/features/whatsapp/hooks/useWhatsAppConnections';

const WhatsAppConnect: React.FC = () => {
  const { connections, loading, error } = useWhatsAppConnections();

  return (
    <div className="mx-auto max-w-4xl py-4 text-[#1A1A1F] animate-in slide-in-from-right duration-500 sm:py-10">
      <header className="mb-6 text-center sm:mb-10">
        <h1 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl">Conexão WhatsApp</h1>
        <p className="text-[#6B7280]">As conexões abaixo pertencem somente a esta barbearia.</p>
      </header>

      <div className="min-h-[320px] rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:min-h-[420px] sm:p-10">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center text-[#6B7280] sm:min-h-[340px]">
            Carregando conexões...
          </div>
        ) : error ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-red-50 text-red-700 sm:min-h-[340px]">
            Não foi possível carregar as conexões.
          </div>
        ) : connections.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center text-center sm:min-h-[340px]">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3F4F6] sm:mb-6 sm:h-28 sm:w-28">
              <span className="material-symbols-outlined text-4xl text-[#9CA3AF] sm:text-5xl">chat_bubble</span>
            </div>
            <h2 className="text-2xl font-bold">Nenhuma conexão cadastrada</h2>
            <p className="mt-3 max-w-md text-sm text-[#6B7280]">
              Uma conta nova começa sem aparelho, QR Code ou instancia herdada.
            </p>
            <button
              disabled
              title="Em breve"
              className="mt-6 min-h-11 w-full cursor-not-allowed rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-[#1A1A1F] opacity-50 sm:mt-8 sm:w-auto sm:px-8 sm:py-4"
            >
              Configurar WhatsApp - Em breve
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">{connection.display_name}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {connection.phone_number || 'Telefone não informado'}
                  </p>
                </div>
                <span className="rounded-full bg-[#F3F4F6] px-4 py-2 text-xs font-bold uppercase text-[#6B7280]">
                  {connection.status || 'Sem status'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConnect;
