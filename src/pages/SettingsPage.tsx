import { User, Shield } from 'lucide-react';

interface SettingsPageProps {
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  userName = 'Demo Staff',
  userRole = 'counsellor',
  userEmail = 'demo@brightpath.edu'
}) => {
  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Account & Settings</h1>
          <p className="page-subtitle">Manage your personal profile and view system role privileges.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--color-accent-500)" />
            <span>Profile Details</span>
          </h3>
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={userName} 
            readOnly 
            style={{ maxWidth: '400px', backgroundColor: 'var(--color-bg-subtle)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            value={userEmail} 
            readOnly 
            style={{ maxWidth: '400px', backgroundColor: 'var(--color-bg-subtle)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Assigned Role</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <span className="badge badge-status-qualified" style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}>
              {userRole}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
              (Role is assigned by administrator; client-side elevation is prohibited)
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--color-accent-500)" />
            <span>Security & Role Boundaries</span>
          </h3>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          BrightPath CRM enforces PostgreSQL Row Level Security (RLS) directly at the database tier. 
          Counsellors only have access to their assigned or created leads, while Managers and Administrators 
          have institute-wide oversight. Role adjustments can only be executed via Supabase SQL procedure.
        </p>
      </div>
    </div>
  );
};
