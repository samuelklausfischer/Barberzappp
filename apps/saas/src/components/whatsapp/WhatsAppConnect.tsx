
import React, { useState } from 'react';

const WhatsAppConnect: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in slide-in-from-right duration-500">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-3">Conexão WhatsApp</h1>
        <p className="text-zinc-500">Envie lembretes e confirmações automáticas para seus clientes.</p>
      </header>

      <div className="bg-zinc-900 border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
        {step === 1 && (
          <div className="text-center space-y-8 max-w-sm animate-in zoom-in duration-300">
            <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center mx-auto shadow-2xl relative">
              <span className="material-symbols-outlined text-6xl text-zinc-600">cloud_off</span>
              <div className="absolute -z-10 w-full h-full border border-dashed border-[#f4c025]/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Sessão Inativa</h2>
              <p className="text-zinc-500 text-sm">O robô não está conectado a nenhum aparelho. Gere um QR Code agora para ativar.</p>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">qr_code_2</span>
              Gerar QR Code
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col lg:flex-row items-center gap-12 animate-in fade-in duration-500">
            <div className="p-4 bg-white rounded-2xl relative shadow-2xl">
              <img 
                src="https://picsum.photos/id/10/300/300" 
                className="w-64 h-64 grayscale contrast-200 blur-[1px]" 
                alt="QR Placeholder" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white p-1 rounded-full shadow-lg">
                  <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#f4c025] text-2xl">chat</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-[#f4c025] shadow-[0_0_15px_#f4c025] animate-[scan_3s_linear_infinite]"></div>
            </div>
            
            <div className="max-w-xs space-y-6">
              <div>
                <h3 className="text-xl font-bold">Escaneie o código</h3>
                <p className="text-zinc-500 text-sm">Abra o WhatsApp no seu celular para continuar.</p>
              </div>
              <div className="space-y-4">
                {[
                  { n: 1, t: 'Abra o WhatsApp no seu celular' },
                  { n: 2, t: 'Toque em Aparelhos Conectados' },
                  { n: 3, t: 'Aponte para o QR Code ao lado' },
                ].map(item => (
                  <div key={item.n} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">{item.n}</span>
                    <p className="text-sm">{item.t}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setStep(3)}
                className="w-full text-zinc-500 text-xs underline decoration-dashed underline-offset-4 hover:text-white"
              >
                Simular Leitura (Debug)
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
              <span className="material-symbols-outlined text-white text-5xl font-bold">check</span>
            </div>
            <div>
              <h2 className="text-3xl font-black">Conectado!</h2>
              <p className="text-zinc-500">A Barbearia do Zé está online agora.</p>
            </div>
            <div className="bg-black/40 px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-500">smartphone</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">iPhone 15 Pro de Zé</p>
                <p className="text-xs text-zinc-500">Online desde as 10:45</p>
              </div>
              <button onClick={() => setStep(1)} className="ml-8 text-red-500 text-xs font-bold hover:underline">Desconectar</button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes scan {
            0% { top: 0; }
            100% { top: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default WhatsAppConnect;
