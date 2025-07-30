import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../layout/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresProfile?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresProfile = false 
}) => {
  const { isAuthenticated, hasProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiresProfile && !hasProfile) {
    return <Navigate to="/create-profile" replace />;
  }

  return <>{children}</>;
};