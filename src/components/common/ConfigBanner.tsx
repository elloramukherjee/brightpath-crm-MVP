import React, { useState } from 'react';
import { Key, ExternalLink, X } from 'lucide-react';
import { isSupabaseConfigured, configErrorMessage } from '../../lib/supabaseClient';

export const ConfigBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isSupabaseConfigured || isDismissed) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#fffbeb',
      borderBottom: '1px solid #fde68a',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      fontSize: '0.875rem',
      color: '#92400e',
      position: 'relative',
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Key size={16} color="#d97706" />
        </div>
        <div>
          <strong style={{ fontWeight: 600 }}>Supabase Connection Needed: </strong>
          <span>{configErrorMessage} Copy your credentials from Supabase into your local <code>.env</code> file.</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <a 
          href="https://supabase.com/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.775rem', padding: '0.25rem 0.6rem', height: 'auto', gap: '0.25rem' }}
        >
          <span>Supabase Dashboard</span>
          <ExternalLink size={12} />
        </a>
        <button 
          onClick={() => setIsDismissed(true)} 
          className="btn-ghost btn-sm"
          style={{ padding: '0.2rem', color: '#b45309' }}
          title="Dismiss warning"
          aria-label="Dismiss banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
