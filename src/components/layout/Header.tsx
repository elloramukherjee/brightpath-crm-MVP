import React from 'react';
import { Menu, Plus, UserCheck } from 'lucide-react';
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
          <UserCheck size={16} color="var(--color-accent-500)" />
          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{userRole} view</span>
        </div>
      </div>
    </header>
  );
};
