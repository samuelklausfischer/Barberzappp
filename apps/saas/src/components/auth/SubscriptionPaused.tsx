import React from 'react';
import { useNavigate } from 'react-router-dom';
import BarberZapLogo from '@/components/ui/BarberZapLogo';
import { useAuth } from '@/features/auth/hooks/useAuth';

const SubscriptionPaused: React.FC = () => {
  const { tenant, trialEndsAt, signOut } = useAuth();
  const navigate = useNavigate();
  const date =
    trialEndsAt && !Number.isNaN(new Date(trialEndsAt).getTime())
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(trialEndsAt))
      : null;
  const logout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };
  return (
    <main className="bz-login-page relative isolate flex min-h-[100dvh] items-center justify-center overflow-x-hidden px-4 py-8 text-[#211b14] sm:px-6">
      <div className="bz-login-orb bz-login-orb-bottom" aria-hidden="true" />
      <section className="bz-login-card bz-login-reveal relative w-full max-w-[560px] rounded-[30px] border border-[#9f7a2c]/[0.18] px-6 py-8 text-center sm:px-10 sm:py-10">
        <BarberZapLogo compact label="BarberZap" tone="light" className="justify-center" />
        <span className="material-symbols-outlined mt-8 text-6xl text-[#956a16]" aria-hidden="true">
          pause_circle
        </span>
        <p className="bz-kicker mt-5 text-[#956a16]">Acesso pausado</p>
        <h1 className="bz-title-serif mt-3 text-5xl font-semibold leading-none text-[#1c1712]">
          Seu teste terminou.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#6d6255]">
          {tenant?.company_name ? `${tenant.company_name} está temporariamente em pausa. ` : ''}
          {date ? `O período de teste encerrou em ${date}. ` : ''}Assine um plano para retomar o
          acesso a toda a operação.
        </p>
        <p className="mt-8 rounded-2xl border border-[#9f7a2c]/[0.14] bg-[#d7ab3f]/[0.07] px-4 py-3 text-sm text-[#69531d]">
          A contratação online ainda está sendo preparada. Fale com o suporte para ativar um plano.
        </p>
        <button
          type="button"
          disabled
          className="mt-5 min-h-12 w-full cursor-not-allowed rounded-2xl border border-[#2f281f]/[0.12] bg-white/55 px-6 text-xs font-bold uppercase tracking-[0.14em] text-[#8b7d6c]"
        >
          Planos em breve
        </button>
        <button
          type="button"
          onClick={logout}
          className="mt-5 text-xs font-bold text-[#805b10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b8861d]/50"
        >
          Sair da conta
        </button>
      </section>
    </main>
  );
};
export default SubscriptionPaused;
