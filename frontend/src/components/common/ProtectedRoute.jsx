import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles } from 'lucide-react';

/**
 * Route protection wrapper requiring an authenticated session.
 * Displays a branded loading state while authenticating.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg animate-pulse mb-4">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-secondary">Verifying CampusPulse credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

