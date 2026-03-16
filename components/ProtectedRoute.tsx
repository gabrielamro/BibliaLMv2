"use client";
import { useLocation, useSearchParams, Navigate } from '../utils/router';

import React from 'react';

import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="animate-spin text-bible-gold" size={40} />
      </div>
    );
  }

  if (!currentUser) {
    // Redireciona para a Landing Page, mas salva a localização que tentaram acessar
    // O LoginModal pode usar esse state para redirecionar de volta após o login
    return <Navigate to="/intro" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;