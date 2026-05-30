
import React from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-luxury-gradient relative overflow-hidden bg-[#09090b]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#f4c025]/10 rounded-full blur-[120px]"></div>
      
      <div className="flex flex-col items-center gap-4 mb-10 z-10">
        <div className="p-3 bg-gradient-to-br from-zinc-800 to-black rounded-2xl border border-white/10">
           <span className="material-symbols-outlined text-primary text-4xl text-[#f4c025]">content_cut</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">BarberZap</h1>
      </div>

      <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta</h2>
          <p className="text-zinc-400 text-sm">Gerencie sua barbearia com excelência</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#f4c025] transition-colors">mail</span>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50 transition-all"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Senha</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#f4c025] transition-colors">lock</span>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-zinc-600 focus:outline-none focus:border-[#f4c025]/50 focus:ring-1 focus:ring-[#f4c025]/50 transition-all"
                required
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <span className="material-symbols-outlined">visibility_off</span>
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-sm text-zinc-400 hover:text-[#f4c025]">Esqueci minha senha</a>
          </div>
          <button type="submit" className="w-full bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">
            Entrar
          </button>
          <div className="relative flex items-center gap-4 text-zinc-600 text-xs uppercase font-bold tracking-widest before:flex-1 before:h-px before:bg-white/10 after:flex-1 after:h-px after:bg-white/10">
            Ou entre com
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
              <span>Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined">apple</span>
              <span>Apple</span>
            </button>
          </div>
        </form>
      </div>
      <p className="mt-10 text-zinc-400">Não tem conta? <a href="#" className="text-[#f4c025] font-bold">Crie grátis</a></p>
    </div>
  );
};

export default Login;
