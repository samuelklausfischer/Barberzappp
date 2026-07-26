import React, { useEffect, useRef } from 'react';
import { aiService } from '@/infrastructure/ai/geminiService';
import { useAIChat } from '@/features/ai/hooks/useAIChat';

const tones = ['Formal', 'Amigável', 'Descolado'] as const;

const AIConfig: React.FC = () => {
  const [tone, setTone] = React.useState<(typeof tones)[number]>('Amigável');
  const [instructions, setInstructions] = React.useState('');
  const [input, setInput] = React.useState('');
  const { messages, isLoading, sendMessage } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading || !aiService.isAvailable) return;
    await sendMessage(prompt, (message) => aiService.generateResponse(message, tone, instructions));
    setInput('');
  };

  const toneIndex = tones.indexOf(tone) + 1;

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">Automação inteligente</p>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#1A1A1F] sm:text-4xl">Configuração da IA</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">Personalize o comportamento e o tom de voz do assistente virtual.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled title="Em breve" className="min-h-11 rounded-full border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold text-[#4B5563] opacity-60 focus:outline-none">Restaurar padrão · Em breve</button>
          <button type="button" disabled title="Em breve" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#1A1A1F] opacity-60 focus:outline-none">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">save</span>Salvar · Em breve
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFFAEB] text-[#8A6A11]"><span className="material-symbols-outlined">record_voice_over</span></div>
              <div><h2 className="text-lg font-semibold text-[#1A1A1F]">Tom de voz</h2><p className="mt-1 text-sm text-[#6B7280]">Defina a personalidade do robô no atendimento.</p></div>
            </div>
            <div className="px-1 pb-2 sm:px-2">
              <input type="range" min="1" max="3" step="1" value={toneIndex} aria-label="Tom de voz da IA" onChange={(event) => setTone(tones[Number(event.target.value) - 1])} className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E5E7EB] accent-[#D4AF37]" />
              <div className="mt-4 flex justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                {tones.map((option, index) => <div key={option} className={`flex flex-col ${index === 0 ? 'items-start' : index === 1 ? 'items-center' : 'items-end'} ${tone === option ? 'text-[#8A6A11]' : ''}`}><span>{option}</span><span className="mt-1 text-[10px] font-normal normal-case tracking-normal text-[#9CA3AF]">{index === 0 ? 'Corporativo' : index === 1 ? 'Padrão' : 'Gírias'}</span></div>)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-7 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFFAEB] text-[#8A6A11]"><span className="material-symbols-outlined">psychology</span></div>
              <div><h2 className="text-lg font-semibold text-[#1A1A1F]">Instruções especiais</h2><p className="mt-1 text-sm text-[#6B7280]">Contexto e regras de negócio para a IA.</p></div>
            </div>
            <div className="relative">
              <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} aria-label="Instruções especiais para a IA" placeholder="Ex.: não agende segundas pela manhã; ofereça um café de cortesia no primeiro corte." className="min-h-[190px] w-full resize-y rounded-xl border border-[#D1D5DB] bg-white p-4 text-sm text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 sm:p-5" />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[#9CA3AF]"><span className="material-symbols-outlined text-sm" aria-hidden="true">info</span><span className="text-xs">Usado apenas nesta sessão</span></div>
            </div>
          </section>
        </div>

        <div className="self-start lg:sticky lg:top-8 lg:col-span-1">
          <div className="flex min-h-[520px] h-[min(600px,calc(100vh-6rem))] w-full flex-col overflow-hidden rounded-3xl border border-[#D1D5DB] bg-[#F7F8FA] shadow-xl shadow-[#1A1A1F]/10">
            <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-white p-4">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37] text-[#1A1A1F]"><span className="material-symbols-outlined font-bold">smart_toy</span><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#F59E0B]"></span></div>
              <div><p className="text-sm font-semibold text-[#1A1A1F]">BarberBot</p><p className="text-[10px] font-semibold text-[#A15C00]">Em breve</p></div>
            </div>
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#F7F8FA] p-4">
              <div className="flex justify-center"><span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B7280]">Hoje</span></div>
              {messages.length === 0 && <p className="mx-auto max-w-[18rem] rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-4 py-5 text-center text-xs leading-5 text-[#6B7280]">A integração da IA estará disponível em uma etapa posterior.</p>}
              {messages.map((message) => <div key={message.id} className={`flex max-w-[85%] flex-col ${message.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}><div className={`rounded-2xl p-3 text-sm ${message.sender === 'user' ? 'rounded-tr-none bg-[#1A1A1F] text-white' : 'rounded-tl-none border border-[#E5E7EB] bg-white text-[#1A1A1F]'}`}>{message.text}</div><span className="mt-1 text-[10px] text-[#9CA3AF]">{message.time}</span></div>)}
              {isLoading && <div className="flex max-w-[85%] gap-2"><div className="rounded-2xl rounded-tl-none border border-[#E5E7EB] bg-white p-3"><div className="flex gap-1"><span className="h-1 w-1 animate-bounce rounded-full bg-[#9CA3AF]"></span><span className="h-1 w-1 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:75ms]"></span><span className="h-1 w-1 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:150ms]"></span></div></div></div>}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-[#E5E7EB] bg-white p-3 sm:p-4">
              <input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Mensagem para testar a IA" placeholder={aiService.isAvailable ? 'Teste a IA aqui...' : 'Integração em breve'} className="min-w-0 flex-1 rounded-full border border-[#D1D5DB] bg-white px-4 text-sm text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20" disabled={isLoading || !aiService.isAvailable} />
              <button type="submit" aria-label="Enviar mensagem" disabled={isLoading || !aiService.isAvailable || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D4AF37] text-[#1A1A1F] shadow-sm transition-colors hover:bg-[#B99220] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"><span className="material-symbols-outlined text-xl font-bold">send</span></button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfig;
