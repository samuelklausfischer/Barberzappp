import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_PATHS } from '@/config/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSkeleton } from '@/components/ui/Skeleton';

interface PublicOnlyRouteProps {
  children: ReactNode;
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F8FA]">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  if (!user) return <>{children}</>;
  return <Navigate to={isAdmin ? APP_PATHS.ADMIN : APP_PATHS.DASHBOARD} replace />;
};

export default PublicOnlyRoute;
