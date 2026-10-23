import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

const AppContent: React.FC = () => {
  const { profile, user, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Staff User';
  const role = profile?.role || 'counsellor';
  const email = user?.email || (profile ? `${profile.full_name.toLowerCase().replace(/\s+/g, '.')}@brightpath.edu` : 'staff@brightpath.edu');

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected CRM Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout 
              userName={displayName} 
              userRole={role} 
              onSignOut={signOut} 
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="followups" element={<FollowUpsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route 
          path="settings" 
          element={
            <SettingsPage 
              userName={displayName} 
              userRole={role} 
              userEmail={email} 
            />
          } 
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
