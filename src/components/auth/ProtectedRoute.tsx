import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        backgroundColor: 'var(--color-bg-app)'
      }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-accent-500)" />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Verifying authentication credentials...</p>
      </div>
    );
  }

  // If unauthenticated (and no demo profile loaded)
  if (!user && !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
