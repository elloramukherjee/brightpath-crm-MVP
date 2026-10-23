import React from 'react';
import type { LeadStatus } from '../../types/crm.types';

export const LeadStatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => {
  const getBadgeClass = (s: LeadStatus) => {
    switch (s) {
      case 'New': return 'badge-status-new';
      case 'Contacted': return 'badge-status-contacted';
      case 'Qualified': return 'badge-status-qualified';
      case 'Converted': return 'badge-status-converted';
      case 'Lost': return 'badge-status-lost';
      default: return 'badge-status-new';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
};
