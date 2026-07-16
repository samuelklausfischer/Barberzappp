import React, { useEffect, useState } from 'react';

interface TrialCountdownProps {
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
}

const getRemaining = (trialEndsAt: string | null | undefined, currentTime: number) => {
  if (!trialEndsAt) {
    return null;
  }

  const remainingMs = new Date(trialEndsAt).getTime() - currentTime;
  const clampedMs = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(clampedMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    expired: remainingMs <= 0,
    label: `${days}d ${hours}h ${minutes}m ${seconds}s`,
  };
};

const TrialCountdown: React.FC<TrialCountdownProps> = ({ subscriptionStatus, trialEndsAt }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = getRemaining(trialEndsAt, now);

  if (subscriptionStatus !== 'trial' || !remaining) {
    return null;
  }

  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[#d7ab3f]/25 bg-[#d7ab3f]/10 px-3.5 py-2 text-xs text-[#f0d57e]">
      <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
      <div className="leading-tight">
        <p className="font-semibold">{remaining.expired ? 'Trial encerrado' : `Trial: ${remaining.label}`}</p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#a99664]">Assine para manter ativo</p>
      </div>
    </div>
  );
};

export default TrialCountdown;
