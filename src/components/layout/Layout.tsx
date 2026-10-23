import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ConfigBanner } from '../common/ConfigBanner';

interface LayoutProps {
  userName?: string;
  userRole?: string;
  onSignOut?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  userName = 'Staff Member',
  userRole = 'counsellor',
  onSignOut
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname.startsWith('/leads/')) return 'Lead Detail';
    if (pathname.startsWith('/leads')) return 'Lead Management';
    if (pathname.startsWith('/followups')) return 'Follow-up Queue';
    if (pathname.startsWith('/reports')) return 'Analytics & Reports';
    if (pathname.startsWith('/settings')) return 'Settings & Profile';
    return 'BrightPath CRM';
  };

  return (
    <div className="app-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userRole={userRole}
        onSignOut={onSignOut}
      />
      <div className="main-wrapper">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageTitle={getPageTitle(location.pathname)}
          userRole={userRole}
        />
        <ConfigBanner />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
