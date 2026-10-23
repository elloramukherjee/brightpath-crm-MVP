import React from 'react';
import { Menu, Plus, UserCheck, Shield, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar: () => void;
  pageTitle?: string;
  onNewLeadClick?: () => void;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  pageTitle = 'Admissions CRM',
  onNewLeadClick,
  userRole = 'counsellor'
}) => {
  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return (
          <span className="role-pill role-pill-admin" title="Full System Administrator Access">
            <Shield size={13} />
            <span>Admin</span>
          </span>
        );
      case 'manager':
        return (
          <span className="role-pill role-pill-manager" title="Admissions Manager Access">
            <Award size={13} />
            <span>Manager</span>
          </span>
        );
      case 'counsellor':
      default:
        return (
          <span className="role-pill role-pill-counsellor" title="Student Counsellor Access">
            <UserCheck size={13} />
            <span>Counsellor</span>
          </span>
        );
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button 
          className="menu-toggle-btn" 
          onClick={onToggleSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{pageTitle}</h2>
      </div>

      <div className="header-right">
        {onNewLeadClick ? (
          <button onClick={onNewLeadClick} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>New Lead</span>
          </button>
        ) : (
          <Link to="/leads?action=new" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>New Lead</span>
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {getRoleBadge(userRole)}
        </div>
      </div>
    </header>
  );
};
