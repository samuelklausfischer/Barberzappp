import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import BarberZapLogo from '@/components/ui/BarberZapLogo';

const benefits = [
  {
    icon: 'calendar_month',
    title: 'Agenda sob controle',
    description: 'Visualize o dia e mantenha a rotina da equipe organizada.',
  },
  {
    icon: 'groups',
    title: 'Clientes por perto',
    description: 'Centralize relacionamentos e acompanhe cada atendimento.',
  },
  {
    icon: 'monitoring',
    title: 'Decisões mais claras',
    description: 'Acompanhe a operação em um painel feito para a barbearia.',
  },
];

const SoonBadge: React.FC = () => (
  <span className="rounded-full border border-[#b8861d]/25 bg-[#d7ab3f]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a6414]">
    Em breve
  </span>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, error } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (loginError) {
      setLocalError(loginError instanceof Error ? loginError.message : 'Erro ao fazer login');
    }
  };

  const displayError = localError || error;

  return (
    <main className="bz-login-page relative isolate min-h-[100dvh] overflow-x-hidden text-[#211b14]">
      <div className="bz-login-orb bz-login-orb-top" aria-hidden="true" />
      <div className="bz-login-orb bz-login-orb-bottom" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-[1600px] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <section className="bz-login-story hidden min-h-[100dvh] flex-col justify-between border-r border-[#2f281f]/[0.08] px-10 py-10 lg:flex xl:px-16 xl:py-12 2xl:px-20">
          <div className="bz-login-reveal">
            <BarberZapLogo label="BarberZap" showTagline tone="light" />
          </div>

          <div className="bz-login-reveal bz-login-reveal-delay my-12 max-w-[720px]">
            <p className="bz-kicker mb-5 text-[#956a16]">Seu negócio, mais simples</p>
            <h1 className="bz-title-serif max-w-[680px] text-[clamp(3.7rem,6vw,7.2rem)] font-semibold leading-[0.86] tracking-[-0.045em] text-[#1b1712]">
              Sua barbearia no ritmo certo.
            </h1>
            <p className="mt-7 max-w-[590px] text-base leading-7 text-[#655c50] xl:text-lg xl:leading-8">
              Agenda, clientes e operação em um só lugar para você dedicar mais tempo ao atendimento e menos à rotina administrativa.
            </p>

            <div className="mt-10 grid gap-3 xl:grid-cols-3">
              {benefits.map((benefit) => (
                <article
                  key={benefit.title}
                  className="bz-login-benefit rounded-[22px] border border-[#9f7a2c]/[0.16] bg-white/55 p-5 shadow-[0_14px_35px_rgba(84,62,25,0.06)]"
                >
                  <span className="material-symbols-outlined text-[24px] text-[#a97918]" aria-hidden="true">
                    {benefit.icon}
                  </span>
                  <h2 className="mt-4 text-sm font-bold text-[#2a231b]">{benefit.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-[#756b5e]">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="bz-login-reveal bz-login-reveal-delay-2 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#756a5d]">
            <span>BarberZap Atelier</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c49328] shadow-[0_0_12px_rgba(196,147,40,0.45)]" />
              Ambiente seguro
            </span>
          </div>
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10 xl:px-14">
          <div className="bz-login-reveal bz-login-reveal-delay w-full max-w-[540px]">
            <div className="mb-6 px-1 lg:hidden">
              <BarberZapLogo compact label="BarberZap" tone="light" />
            </div>

            <div className="bz-login-card rounded-[28px] border border-[#9f7a2c]/[0.18] px-5 py-6 sm:rounded-[32px] sm:px-8 sm:py-8 xl:px-10 xl:py-9">
              <header className="mb-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="bz-kicker text-[#956a16]">Acesso ao painel</p>
                  <span className="flex items-center gap-2 text-[10px] font-semibold text-[#8b6b2c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#c49328]" />
                    Conexão protegida
                  </span>
                </div>
                <h1 className="bz-title-serif text-[clamp(2.7rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-[#1c1712]">
                  Bem-vindo de volta.
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-[#6d6255]">
                  Entre com seus dados para continuar gerenciando sua operação.
                </p>
              </header>

              {displayError && (
                <div
                  id="login-error"
                  role="alert"
                  aria-live="assertive"
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-[#b85c5c]/25 bg-[#fff2f1] px-4 py-3.5"
                >
                  <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#b94a4a]" aria-hidden="true">
                    error
                  </span>
                  <p className="text-sm leading-5 text-[#8f2f2f]">{displayError}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5" aria-describedby={displayError ? 'login-error' : undefined}>
                <div>
                  <label htmlFor="login-email" className="mb-2.5 block text-xs font-bold text-[#3e352b]">
                    E-mail de acesso
                  </label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[21px] text-[#8c7e6e]"
                      aria-hidden="true"
                    >
                      mail
                    </span>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="nome@exemplo.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="bz-input min-h-12 py-3.5 pl-12 pr-4 text-[15px]"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <label htmlFor="login-password" className="text-xs font-bold text-[#3e352b]">
                      Senha
                    </label>
                    <button
                      type="button"
                      disabled
                      className="flex cursor-not-allowed items-center gap-2 text-[10px] font-bold text-[#8e8173]"
                    >
                      Esqueceu a senha?
                      <SoonBadge />
                    </button>
                  </div>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[21px] text-[#8c7e6e]"
                      aria-hidden="true"
                    >
                      lock
                    </span>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="bz-input min-h-12 py-3.5 pl-12 pr-12 text-[15px]"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8c7e6e] transition-colors hover:bg-black/[0.04] hover:text-[#2a2219] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8861d]/50"
                    >
                      <span className="material-symbols-outlined text-[21px]" aria-hidden="true">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bz-btn-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-xs uppercase tracking-[0.16em] transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8861d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e9] disabled:cursor-wait disabled:opacity-60"
                >
                  {loading && <span className="bz-login-spinner" aria-hidden="true" />}
                  {loading ? 'Entrando...' : 'Entrar no BarberZap'}
                </button>

                <div className="flex items-center gap-3 pt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#8a7c6b] before:h-px before:flex-1 before:bg-black/[0.09] after:h-px after:flex-1 after:bg-black/[0.09]">
                  Acessos futuros
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['Apple', 'Google'].map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      disabled
                      className="flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-[#2f281f]/[0.1] bg-white/60 px-3 text-xs font-semibold text-[#85786a]"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/[0.1] text-[10px] font-bold">
                        {provider.charAt(0)}
                      </span>
                      {provider}
                      <span className="hidden text-[8px] uppercase tracking-[0.12em] text-[#92836f] sm:inline">Em breve</span>
                    </button>
                  ))}
                </div>
              </form>

              <div className="mt-6 border-t border-black/[0.08] pt-5 text-center">
                <p className="text-xs text-[#7f7365]">
                  Ainda não é parceiro?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/cadastro')}
                    className="font-bold text-[#956a16] transition-colors hover:text-[#6f4d0b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8861d]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2e9]"
                  >
                    Crie sua conta de teste
                  </button>
                </p>
              </div>
            </div>

            <footer className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8c8174]">
              <span>© 2026 BarberZap</span>
              <span>Privacidade</span>
              <span>Suporte</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
