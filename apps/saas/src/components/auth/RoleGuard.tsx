import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('owner' | 'employee')[];
  redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}) => {
  const { membership, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#f4c025] border-t-transparent"></div>
      </div>
    );
  }

  if (!membership) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(membership.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
