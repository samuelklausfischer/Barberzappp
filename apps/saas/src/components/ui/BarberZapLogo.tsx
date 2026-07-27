import React, { useId } from 'react';

type BarberZapLogoProps = {
  compact?: boolean;
  className?: string;
  label?: string;
  tone?: 'light' | 'dark';
};

const BarberZapLogo: React.FC<BarberZapLogoProps> = ({
  compact = false,
  className = '',
  label,
  tone = 'dark',
}) => {
  const instanceId = useId().replace(/:/g, '');
  const gradientId = `barberzap-gold-${instanceId}`;
  const maskId = `barberzap-cutout-${instanceId}`;
  const isDecorative = !label;
  const wordmarkColor = tone === 'light' ? 'text-[#1A1A1F]' : 'text-[#f3eee6]';

  return (
    <div
      className={'flex items-center ' + (compact ? 'gap-3' : 'gap-4') + ' ' + className}
      role={isDecorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={isDecorative ? true : undefined}
    >
      <svg
        viewBox="0 0 88 88"
        className={compact ? 'h-12 w-12 shrink-0' : 'h-16 w-16 shrink-0'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="16" y1="14" x2="72" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F7DE91" />
            <stop offset="0.48" stopColor="#D7AB3F" />
            <stop offset="1" stopColor="#9B6D18" />
          </linearGradient>
          <mask id={maskId} x="0" y="0" width="88" height="88" maskUnits="userSpaceOnUse">
            <path
              d="M15 16h37c13.7 0 22 6.9 22 17.4 0 7.3-4.3 12.4-11.4 15.3 6.1 2.5 9.4 7.1 9.4 13.1C72 72.1 63.8 78 50.1 78H15l12.2-12.8h22.1c4.2 0 6.3-1.5 6.3-4.5 0-2.7-2.1-4.1-6.3-4.1H31l10.7-11.2h9.6c5.1 0 7.9-1.8 7.9-5.1 0-3.2-2.8-5-7.9-5H27.2L15 16Z"
              fill="white"
            />
            <path d="m24.2 26.7 8.4 8.4-17.6 18.2 8.7 8.7 8.8-9.1-8.4-8.4 8.6-8.9-8.5-8.9Z" fill="black" />
          </mask>
        </defs>
        <rect width="88" height="88" fill={`url(#${gradientId})`} mask={`url(#${maskId})`} />
      </svg>

      <div className="min-w-0">
        <p
          className={[
            'font-extrabold',
            'leading-none',
            'tracking-[-0.045em]',
            wordmarkColor,
            compact ? 'text-[1.5rem]' : 'text-[2.2rem]',
          ].join(' ')}
        >
          Barber<span className="text-[#b8841c]">Zap</span>
        </p>
      </div>
    </div>
  );
};

export default BarberZapLogo;
