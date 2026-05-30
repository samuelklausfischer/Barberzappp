import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-white/[0.05] ${className}`} />
);

interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'list' | 'table';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  count = 3, 
  type = 'card' 
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bz-panel rounded-[24px] p-6">
            <Skeleton className="w-14 h-14 mb-6" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-10" />
            <div className="pt-6 border-t border-white/5 flex justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bz-panel-soft flex items-center gap-4 rounded-[22px] p-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  // Table
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bz-panel-soft flex items-center gap-4 rounded-[22px] p-4">
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'inbox', 
  title, 
  description,
  action 
}) => (
  <div className="text-center py-20">
    <span className="material-symbols-outlined mb-4 text-5xl text-[#8d8373]">{icon}</span>
    <p className="bz-title-serif text-4xl leading-none text-white">{title}</p>
    {description && (
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#a89e8f]">{description}</p>
    )}
    {action && (
      <button
        onClick={action.onClick}
        className="bz-btn-primary mt-6 rounded-full px-6 py-3 text-sm uppercase tracking-[0.16em] transition-all"
      >
        {action.label}
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Algo deu errado',
  message, 
  onRetry 
}) => (
  <div className="rounded-[24px] border border-[#c97878]/25 bg-[#c97878]/10 p-6 text-center">
    <span className="material-symbols-outlined mb-4 text-5xl text-[#f2b2b2]">error</span>
    <h3 className="mb-2 text-lg font-bold text-[#f4cccc]">{title}</h3>
    <p className="mb-6 text-sm text-[#f2b2b2]/80">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-full border border-[#c97878]/30 bg-[#c97878]/15 px-6 py-3 text-sm font-semibold text-[#f4cccc] transition-all hover:bg-[#c97878]/20"
      >
        Tentar novamente
      </button>
    )}
  </div>
);
