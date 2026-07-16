import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

type AuthMode = 'login' | 'trial';

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUpTrial, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const resetMessages = () => {
    setLocalError(null);
    setLocalNotice(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Erro ao fazer login');
    }
  };

  const handleTrialSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    try {
      await signUpTrial({
        email,
        password,
        fullName,
        companyName,
        phone,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar teste gratis';
      if (message.toLowerCase().includes('confirme seu e-mail')) {
        setLocalNotice(message);
      } else {
        setLocalError(message);
      }
    }
  };

  const displayError = localError || error;
  const isTrial = mode === 'trial';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090807] px-5 py-8 text-[#f6f1e8] sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(215,171,63,0.15),transparent_30%),linear-gradient(180deg,#0c0b0a_0%,#090807_100%)]" />
      <div className="pointer-events-none absolute inset-0 bz-grid-lines opacity-20" />

      <div className="relative z-10 w-full max-w-[560px]">
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
          <div className="mb-7 text-center">
            <h2 className="bz-title-serif text-3xl leading-none text-white sm:text-4xl">
              {isTrial ? 'Comece seu teste' : 'Bem-vindo de volta'}
            </h2>
            <p className="mt-3 text-sm text-[#c8bdab] sm:text-base">
              {isTrial
                ? 'Crie sua conta trial de 7 dias e configure a base inicial da barbearia.'
                : 'Acesse sua operacao premium com clareza, elegancia e controle.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className={`rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                !isTrial ? 'bg-[#d7ab3f] text-black' : 'text-[#b8ac99] hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('trial');
                resetMessages();
              }}
              className={`rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                isTrial ? 'bg-[#d7ab3f] text-black' : 'text-[#b8ac99] hover:text-white'
              }`}
            >
              Teste 7 dias
            </button>
          </div>

          {displayError && (
            <div className="mb-6 rounded-2xl border border-[#c97878]/30 bg-[#c97878]/10 px-4 py-4 text-left">
              <p className="text-sm font-medium text-[#f2c0c0]">{displayError}</p>
            </div>
          )}

          {localNotice && (
            <div className="mb-6 rounded-2xl border border-[#d7ab3f]/30 bg-[#d7ab3f]/10 px-4 py-4 text-left">
              <p className="text-sm font-medium text-[#f0d57e]">{localNotice}</p>
            </div>
          )}

          <form onSubmit={isTrial ? handleTrialSignup : handleLogin} className="space-y-5">
            {isTrial && (
              <>
                <div>
                  <label className="bz-kicker mb-3 block">Responsavel</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bz-input px-4 py-3.5 text-base"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="bz-kicker mb-3 block">Nome da barbearia</label>
                  <input
                    type="text"
                    placeholder="Barbearia Exemplo"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bz-input px-4 py-3.5 text-base"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="bz-kicker mb-3 block">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bz-input px-4 py-3.5 text-base"
                    disabled={loading}
                  />
                </div>
              </>
            )}

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
                {!isTrial && (
                  <button type="button" className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d7ab3f] transition-colors hover:text-[#f0d57e]">
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#9f9689]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bz-input py-3.5 pl-12 pr-12 text-base"
                  required
                  minLength={6}
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
              {loading ? 'Processando...' : isTrial ? 'Criar teste gratis de 7 dias' : 'Entrar no BarberZap'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#b8ac99] sm:text-base">
            {isTrial ? 'Ja possui conta?' : 'Nao possui conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isTrial ? 'login' : 'trial');
                resetMessages();
              }}
              className="font-semibold text-[#f0d57e] hover:underline"
            >
              {isTrial ? 'Entrar agora' : 'Criar teste gratis'}
            </button>
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
