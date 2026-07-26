import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BarberZapLogo from '@/components/ui/BarberZapLogo';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { registerTrial } from '@/features/auth/services/trialRegistration';
type Form = {
  name: string;
  barbershop: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  confirmation: string;
  terms: boolean;
  website: string;
};
const empty: Form = {
  name: '',
  barbershop: '',
  email: '',
  phone: '',
  cpf: '',
  password: '',
  confirmation: '',
  terms: false,
  website: '',
};
const digits = (value: string) => value.replace(/\D/g, '');
const cpfFormat = (value: string) =>
  digits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const phoneFormat = (value: string) => {
  const raw = digits(value).slice(0, 11);
  return raw.length <= 10
    ? raw.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
    : raw.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};
const cpfValid = (value: string) => {
  const cpf = digits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const verifier = (length: number) => {
    const total = cpf
      .slice(0, length)
      .split('')
      .reduce((sum, current, index) => sum + Number(current) * (length + 1 - index), 0);
    const result = (total * 10) % 11;
    return result === 10 ? 0 : result;
  };
  return verifier(9) === Number(cpf[9]) && verifier(10) === Number(cpf[10]);
};
const Field: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({
  label,
  id,
  children,
}) => (
  <div>
    <label htmlFor={id} className="mb-2.5 block text-xs font-bold text-[#3e352b]">
      {label}
    </label>
    {children}
  </div>
);
const TrialRegistration: React.FC = () => {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    const fullName = form.name.trim();
    const companyName = form.barbershop.trim();
    const email = form.email.trim().toLowerCase();
    const phone = digits(form.phone);
    if (fullName.length < 2) return setError('Informe o nome completo do responsável.');
    if (companyName.length < 2) return setError('Informe o nome da barbearia.');
    if (email.length > 254) return setError('Informe um e-mail válido.');
    if (phone.length < 10) return setError('Informe um telefone válido com DDD.');
    if (!cpfValid(form.cpf)) return setError('Informe um CPF válido para iniciar o teste.');
    if (form.password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres.');
    if (form.password.length > 128) return setError('A senha deve ter no máximo 128 caracteres.');
    if (form.password !== form.confirmation) return setError('A confirmação de senha não confere.');
    if (!form.terms) return setError('Você precisa aceitar os termos para criar a conta.');
    setLoading(true);
    const password = form.password;
    try {
      const result = await registerTrial({
        full_name: fullName,
        company_name: companyName,
        email,
        phone,
        cpf: digits(form.cpf),
        password,
        terms_accepted: form.terms,
        website: form.website,
      });
      setForm((current) => ({ ...current, cpf: '', password: '', confirmation: '', website: '' }));
      if (result.requires_email_confirmation) {
        setSuccess(result.message || 'Enviamos um link de confirmação para o seu e-mail.');
        return;
      }
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (reason) {
      setForm((current) => ({ ...current, cpf: '', password: '', confirmation: '' }));
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  };
  if (success)
    return (
      <main className="bz-login-page relative isolate flex min-h-[100dvh] items-center justify-center px-4 py-8 text-[#211b14]">
        <section className="bz-login-card bz-login-reveal w-full max-w-[520px] rounded-[30px] border border-[#9f7a2c]/[0.18] px-6 py-9 text-center sm:px-10">
          <BarberZapLogo compact label="BarberZap" tone="light" className="justify-center" />
          <span
            className="material-symbols-outlined mt-8 text-5xl text-[#956a16]"
            aria-hidden="true"
          >
            mark_email_read
          </span>
          <p className="bz-kicker mt-5 text-[#956a16]">Conta criada</p>
          <h1 className="bz-title-serif mt-3 text-5xl font-semibold text-[#1c1712]">
            Confira seu e-mail.
          </h1>
          <p className="mt-5 text-sm leading-6 text-[#6d6255]">{success}</p>
          <Link
            to="/login"
            className="bz-btn-primary mt-8 inline-flex min-h-12 items-center rounded-2xl px-6 text-xs font-bold uppercase tracking-[0.14em]"
          >
            Voltar para entrar
          </Link>
        </section>
      </main>
    );
  return (
    <main className="bz-login-page relative isolate min-h-[100dvh] overflow-x-hidden px-4 py-6 text-[#211b14] sm:px-6 sm:py-10">
      <div className="bz-login-orb bz-login-orb-top" aria-hidden="true" />
      <div className="bz-login-reveal relative mx-auto w-full max-w-[760px]">
        <header className="mb-6 flex items-center justify-between gap-5">
          <BarberZapLogo compact label="BarberZap" tone="light" />
          <Link to="/login" className="text-xs font-bold text-[#805b10]">
            Já tenho acesso
          </Link>
        </header>
        <section className="bz-login-card rounded-[28px] border border-[#9f7a2c]/[0.18] px-5 py-7 sm:rounded-[32px] sm:px-9 sm:py-9">
          <div className="border-b border-black/[0.08] pb-7">
            <p className="bz-kicker text-[#956a16]">Teste gratuito de 7 dias</p>
            <h1 className="bz-title-serif mt-3 text-[clamp(2.8rem,6vw,4.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[#1c1712]">
              Comece com a sua barbearia.
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#6d6255]">
              Sem cartão agora. Usamos o CPF apenas para garantir um único período de teste por
              pessoa.
            </p>
          </div>
          {error && (
            <div
              id="trial-error"
              role="alert"
              aria-live="assertive"
              className="mt-6 rounded-2xl border border-[#b85c5c]/25 bg-[#fff2f1] px-4 py-3.5 text-sm text-[#8f2f2f]"
            >
              {error}
            </div>
          )}
          <form
            onSubmit={submit}
            className="mt-7 space-y-5"
            aria-describedby={error ? 'trial-error' : undefined}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nome do responsável" id="name">
                <input
                  id="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="bz-input min-h-12 px-4 py-3"
                  minLength={2}
                  maxLength={120}
                  required
                  disabled={loading}
                />
              </Field>
              <Field label="Nome da barbearia" id="shop">
                <input
                  id="shop"
                  autoComplete="organization"
                  value={form.barbershop}
                  onChange={(e) => set('barbershop', e.target.value)}
                  className="bz-input min-h-12 px-4 py-3"
                  minLength={2}
                  maxLength={120}
                  required
                  disabled={loading}
                />
              </Field>
              <Field label="E-mail" id="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="bz-input min-h-12 px-4 py-3"
                  maxLength={254}
                  required
                  disabled={loading}
                />
              </Field>
              <Field label="Telefone" id="phone">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', phoneFormat(e.target.value))}
                  className="bz-input min-h-12 px-4 py-3"
                  required
                  disabled={loading}
                />
              </Field>
              <Field label="CPF" id="cpf">
                <input
                  id="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  value={form.cpf}
                  onChange={(e) => set('cpf', cpfFormat(e.target.value))}
                  placeholder="000.000.000-00"
                  className="bz-input min-h-12 px-4 py-3"
                  required
                  disabled={loading}
                />
              </Field>
              <Field label="Senha" id="password">
                <div className="relative">
                  <input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    className="bz-input min-h-12 px-4 py-3 pr-12"
                    minLength={8}
                    maxLength={128}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7e6e]"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {show ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </Field>
              <Field label="Confirmar senha" id="confirmation">
                <input
                  id="confirmation"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmation}
                  onChange={(e) => set('confirmation', e.target.value)}
                  className="bz-input min-h-12 px-4 py-3"
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={loading}
                />
              </Field>
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Site</label>
                <input
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-black/[0.08] bg-white/45 px-4 py-3.5 text-sm leading-5 text-[#5f5549]">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => set('terms', e.target.checked)}
                disabled={loading}
                className="mt-0.5 h-4 w-4 accent-[#b8861d]"
              />
              <span>
                Li e aceito os termos de uso e a política de privacidade para criar a conta de
                teste.
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="bz-btn-primary flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-xs uppercase tracking-[0.16em] disabled:cursor-wait disabled:opacity-60"
            >
              {loading && <span className="bz-login-spinner" aria-hidden="true" />}
              {loading ? 'Criando conta...' : 'Ativar 7 dias de teste'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
export default TrialRegistration;
