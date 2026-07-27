import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_PATHS } from '@/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSkeleton } from '@/components/ui/Skeleton';

interface AdminGuardProps {
  children: ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101114] px-5">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  if (!user) return <Navigate to={APP_PATHS.LOGIN} replace />;
  if (!isAdmin) return <Navigate to={APP_PATHS.DASHBOARD} replace />;

  return <>{children}</>;
};

export default AdminGuard;
