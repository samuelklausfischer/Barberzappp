import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  const displayError = localError || error;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090807] px-5 py-8 text-[#f6f1e8] sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,171,63,0.15),transparent_30%),linear-gradient(180deg,#0c0b0a_0%,#090807_100%)]" />
      <div className="pointer-events-none absolute inset-0 bz-grid-lines opacity-20" />

      <div className="relative z-10 w-full max-w-[540px]">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d7ab3f]/30 bg-black/30 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
            <span className="material-symbols-outlined text-4xl text-[#f0d57e]">content_cut</span>
          </div>
          <div>
            <p className="bz-title-serif text-4xl leading-none text-[#f0d57e] sm:text-5xl">BarberZap</p>
            <p className="mt-2 text-xs uppercase tracking-[0.34em] text-[#9a8f7d]">The Digital Concierge Experience</p>
          </div>
        </div>

        <div className="bz-panel bz-gold-ring rounded-[30px] px-5 py-6 sm:px-10 sm:py-8">
          <div className="mb-8 text-center">
            <h2 className="bz-title-serif text-3xl leading-none text-white sm:text-4xl">Bem-vindo de volta</h2>
            <p className="mt-3 text-sm text-[#c8bdab] sm:text-base">Acesse sua operação premium com clareza, elegância e controle.</p>
          </div>

          {displayError && (
            <div className="mb-6 rounded-2xl border border-[#c97878]/30 bg-[#c97878]/10 px-4 py-4 text-left">
              <p className="text-sm font-medium text-[#f2c0c0]">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="bz-kicker mb-3 block">E-mail de acesso</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9f9689]">mail</span>
                <input
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bz-input py-3.5 pl-12 pr-4 text-base"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="bz-kicker block">Senha</label>
                <button type="button" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d7ab3f] transition-colors hover:text-[#f0d57e]">
                  Esqueceu?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9f9689]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bz-input py-3.5 pl-12 pr-12 text-base"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9f9689] transition-colors hover:text-white"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bz-btn-primary w-full rounded-[18px] px-6 py-4 text-sm uppercase tracking-[0.16em] transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no BarberZap'}
            </button>

            <div className="flex items-center gap-3 pt-2 text-xs uppercase tracking-[0.24em] text-[#6f6659] before:h-px before:flex-1 before:bg-white/8 after:h-px after:flex-1 after:bg-white/8">
              Ou continue com
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                className="relative rounded-[18px] border border-white/8 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-[#d8cdbd] transition-colors hover:bg-white/[0.05]"
                disabled
              >
                <span className="absolute right-3 top-3 rounded-full bg-[#d7ab3f]/18 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f0d57e]">
                  Em breve
                </span>
                Continuar com Apple
              </button>
              <button
                type="button"
                className="relative rounded-[18px] border border-white/8 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-[#d8cdbd] transition-colors hover:bg-white/[0.05]"
                disabled
              >
                <span className="absolute right-3 top-3 rounded-full bg-[#d7ab3f]/18 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f0d57e]">
                  Em breve
                </span>
                Continuar com Google
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-[#b8ac99] sm:text-base">
            Não possui conta? <span className="font-semibold text-[#f0d57e]">Torne-se parceiro</span>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-[0.22em] text-[#6f6659]">
          <span>2024 BarberZap Atelier</span>
          <span>Privacidade</span>
          <span>Suporte</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
