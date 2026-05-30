import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const join = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const Panel: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={join('bz-panel rounded-[20px] xl:rounded-[22px]', className)} {...props} />
);

export const SoftPanel: React.FC<DivProps> = ({ className, ...props }) => (
  <div className={join('bz-panel-soft rounded-[18px] xl:rounded-[20px]', className)} {...props} />
);

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div className="space-y-2.5">
      {eyebrow ? <p className="bz-kicker">{eyebrow}</p> : null}
      <div className="space-y-1.5">
        <h1 className="bz-title-serif text-[clamp(2.1rem,3.3vw,3.4rem)] leading-none text-[#f6f1e8]">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-[#c8bdab]">{description}</p> : null}
      </div>
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

interface MetricCardProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  accent?: 'gold' | 'emerald' | 'danger' | 'neutral';
}

const accents = {
  gold: 'text-[#d7ab3f] bg-[#d7ab3f]/12',
  emerald: 'text-[#97b295] bg-[#97b295]/12',
  danger: 'text-[#c97878] bg-[#c97878]/12',
  neutral: 'text-[#f6f1e8] bg-white/5',
};

export const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, detail, accent = 'gold' }) => (
  <Panel className="p-4 sm:p-5">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <p className="bz-kicker mb-1">{label}</p>
        <div className="bz-title-serif text-[clamp(1.8rem,2.6vw,2.8rem)] leading-none">{value}</div>
      </div>
      <div className={join('flex h-9 w-9 items-center justify-center rounded-[16px]', accents[accent])}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
    </div>
    {detail ? <div className="text-xs leading-5 text-[#c8bdab]">{detail}</div> : null}
  </Panel>
);

export const StatusBadge: React.FC<{ label: string; tone?: 'gold' | 'emerald' | 'danger' | 'neutral' }> = ({
  label,
  tone = 'neutral',
}) => (
  <span
    className={join(
      'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
      'xl:px-2.5 xl:py-0.5 xl:text-[10px]',
      tone === 'gold' && 'border-[#d7ab3f]/30 bg-[#d7ab3f]/10 text-[#f0d57e]',
      tone === 'emerald' && 'border-[#97b295]/30 bg-[#97b295]/10 text-[#c2d5c0]',
      tone === 'danger' && 'border-[#c97878]/30 bg-[#c97878]/10 text-[#efb4b4]',
      tone === 'neutral' && 'border-white/10 bg-white/5 text-[#d7c9b6]',
    )}
  >
    {label}
  </span>
);

export const EmptyPremium: React.FC<{
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <Panel className="px-5 py-10 text-center sm:px-8">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#d7ab3f]">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h3 className="bz-title-serif mb-2 text-[clamp(1.75rem,2.5vw,2.5rem)] leading-none">{title}</h3>
    <p className="mx-auto max-w-lg text-sm text-[#c8bdab] sm:text-base">{description}</p>
    {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
  </Panel>
);

export const SectionTitle: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title,
  subtitle,
  action,
}) => (
  <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="bz-title-serif text-[clamp(1.65rem,2.2vw,2.2rem)] leading-none text-[#f6f1e8]">{title}</h2>
      {subtitle ? <p className="mt-1 text-xs text-[#9f9689] sm:text-sm">{subtitle}</p> : null}
    </div>
    {action}
  </div>
);
