
import React, { useRef, useEffect } from 'react';
import { aiService } from '@/infrastructure/ai/geminiService';
import { useAIChat } from '@/features/ai/hooks/useAIChat';

const AIConfig: React.FC = () => {
  const [tone, setTone] = React.useState('Amigável');
  const [instructions, setInstructions] = React.useState('');
  const [input, setInput] = React.useState('');
  const { messages, isLoading, sendMessage } = useAIChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input, (prompt) => aiService.generateResponse(prompt, tone, instructions));
    setInput('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Configuração da IA</h1>
          <p className="text-zinc-500">Personalize o comportamento e tom de voz do seu assistente virtual</p>
        </div>
        <div className="flex gap-4">
          <button className="h-10 px-6 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-all">Restaurar Padrão</button>
          <button className="h-10 px-6 rounded-xl bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold shadow-lg shadow-[#f4c025]/20 flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-lg">save</span>
            Salvar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-[#f4c025]/10 text-[#f4c025]">
                <span className="material-symbols-outlined">record_voice_over</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Tom de Voz</h2>
                <p className="text-zinc-500 text-sm">Defina a personalidade do robô no atendimento</p>
              </div>
            </div>
            
            <div className="px-2 pb-6">
              <input 
                type="range" 
                min="1" max="3" step="1" 
                value={tone === 'Formal' ? 1 : tone === 'Amigável' ? 2 : 3}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  setTone(v === 1 ? 'Formal' : v === 2 ? 'Amigável' : 'Descolado');
                }}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#f4c025] mb-4" 
              />
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                <div className={`flex flex-col items-start ${tone === 'Formal' ? 'text-white' : ''}`}>
                  <span>Formal</span>
                  <span className="text-[10px] font-normal lowercase mt-1">Corporativo</span>
                </div>
                <div className={`flex flex-col items-center ${tone === 'Amigável' ? 'text-white' : ''}`}>
                  <span className={tone === 'Amigável' ? 'text-[#f4c025]' : ''}>Amigável</span>
                  <span className="text-[10px] font-normal lowercase mt-1">Padrão</span>
                </div>
                <div className={`flex flex-col items-end ${tone === 'Descolado' ? 'text-white' : ''}`}>
                  <span>Descolado</span>
                  <span className="text-[10px] font-normal lowercase mt-1">Gírias</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-[#f4c025]/10 text-[#f4c025]">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Instruções Especiais</h2>
                <p className="text-zinc-500 text-sm">Contexto e regras de negócio para a IA</p>
              </div>
            </div>
            <div className="relative">
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex: Não agende segundas pela manhã; Sempre ofereça um café de cortesia no primeiro corte; Pergunte se o cliente deseja fazer a barba também."
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white placeholder-zinc-700 min-h-[200px] focus:outline-none focus:border-[#f4c025] focus:ring-1 focus:ring-[#f4c025] transition-all"
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-zinc-600">
                <span className="material-symbols-outlined text-sm">info</span>
                <span className="text-xs">Contexto para a IA</span>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1 h-[600px] sticky top-32">
          <div className="w-full h-full bg-zinc-950 border-[6px] border-zinc-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-zinc-900 p-4 flex items-center gap-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#f4c025] flex items-center justify-center relative">
                <span className="material-symbols-outlined text-black font-bold">smart_toy</span>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></span>
              </div>
              <div>
                <p className="text-sm font-bold">BarberBot</p>
                <p className="text-green-500 text-[10px] font-bold">Online</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-hide bg-[#09090b]">
              <div className="flex justify-center">
                <span className="bg-zinc-900 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-600 uppercase">Hoje</span>
              </div>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                    ? 'bg-zinc-800 text-white rounded-tr-none' 
                    : 'bg-zinc-900 border border-white/5 text-zinc-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-zinc-600 mt-1">{msg.time}</span>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 max-w-[85%]">
                  <div className="bg-zinc-900 p-3 rounded-2xl rounded-tl-none animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900 border-t border-white/5 flex gap-2">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Teste a IA aqui..."
                className="flex-1 bg-black/40 border-none rounded-full px-4 text-sm focus:ring-1 focus:ring-[#f4c025]"
                disabled={isLoading}
              />
              <button disabled={isLoading} className="w-10 h-10 bg-[#f4c025] text-black rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 disabled:opacity-50">
                <span className="material-symbols-outlined text-xl font-bold">send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfig;
