import React from 'react';

interface SkeletonProps { className?: string; }

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-xl bg-[#E5E7EB] ${className}`} />
);

interface LoadingSkeletonProps { count?: number; type?: 'card' | 'list' | 'table'; }

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 3, type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <Skeleton className="mb-6 h-12 w-12" />
            <Skeleton className="mb-2 h-5 w-3/4" />
            <Skeleton className="mb-10 h-4 w-full" />
            <div className="flex justify-between border-t border-[#E5E7EB] pt-5"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-16" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'list') {
    return <div className="space-y-3">{Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"><Skeleton className="h-11 w-11 rounded-full" /><div className="flex-1"><Skeleton className="mb-2 h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-8 w-20 rounded-lg" /></div>
    ))}</div>;
  }
  return <div className="space-y-2">{Array.from({ length: count }).map((_, i) => (
    <div key={i} className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"><Skeleton className="h-4 w-1/6" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-20" /></div>
  ))}</div>;
};

interface EmptyStateProps { icon?: string; title: string; description?: string; action?: { label: string; onClick: () => void }; }

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'inbox', title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-5 py-16 text-center">
    <span className="material-symbols-outlined mb-4 text-5xl text-[#9CA3AF]" aria-hidden="true">{icon}</span>
    <p className="text-2xl font-semibold leading-tight text-[#1A1A1F]">{title}</p>
    {description && <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#6B7280]">{description}</p>}
    {action && <button type="button" onClick={action.onClick} className="mt-6 min-h-11 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#1A1A1F] transition-colors hover:bg-[#B99220] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50">{action.label}</button>}
  </div>
);

interface ErrorStateProps { title?: string; message: string; onRetry?: () => void; }

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Algo deu errado', message, onRetry }) => (
  <div role="alert" className="rounded-2xl border border-[#FECDCA] bg-[#FEF3F2] p-6 text-center">
    <span className="material-symbols-outlined mb-3 text-4xl text-[#B42318]" aria-hidden="true">error</span>
    <h3 className="mb-2 text-lg font-semibold text-[#912018]">{title}</h3>
    <p className="mb-6 text-sm text-[#B42318]">{message}</p>
    {onRetry && <button type="button" onClick={onRetry} className="min-h-11 rounded-full border border-[#FDA29B] bg-white px-6 py-3 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#FFF6F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50">Tentar novamente</button>}
  </div>
);
