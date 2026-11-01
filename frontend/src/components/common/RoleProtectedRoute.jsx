import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

/**
 * Role-aware route guard ensuring the user has one of the required roles.
 * Redirects unauthorized users to their authorized portal or login.
 */
export const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg animate-pulse mb-4">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-secondary">Verifying role permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect authenticated users attempting to access unauthorized role portals
    const target = role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default RoleProtectedRoute;

