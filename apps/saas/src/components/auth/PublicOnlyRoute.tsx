import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_PATHS } from '@/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSkeleton } from '@/components/ui/Skeleton';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F8FA]">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  return user ? <Navigate to={APP_PATHS.DASHBOARD} replace /> : <>{children}</>;
};

export default PublicOnlyRoute;
