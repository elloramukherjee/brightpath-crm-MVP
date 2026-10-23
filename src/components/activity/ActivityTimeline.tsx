import React from 'react';
import { 
  PlusCircle, 
  RefreshCw, 
  CalendarClock, 
  CheckCircle2, 
  MessageSquare,
  History
} from 'lucide-react';
import type { Activity, ActivityType } from '../../types/crm.types';

interface ActivityTimelineProps {
  activities: Activity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '2rem 1rem' }}>
        <div className="empty-state-icon">
          <History size={24} />
        </div>
        <h4 className="empty-state-title">No activities recorded yet</h4>
        <p className="empty-state-text">Changes to status, notes, and scheduled follow-ups will appear here.</p>
      </div>
    );
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'created':
        return <PlusCircle size={15} color="#2563eb" />;
      case 'status_changed':
        return <RefreshCw size={15} color="#7c3aed" />;
      case 'follow_up_created':
        return <CalendarClock size={15} color="#d97706" />;
      case 'follow_up_completed':
        return <CheckCircle2 size={15} color="#059669" />;
      case 'note_added':
      default:
        return <MessageSquare size={15} color="#0284c7" />;
    }
  };

  const getBorderColor = (type: ActivityType) => {
    switch (type) {
      case 'created': return '#2563eb';
      case 'status_changed': return '#7c3aed';
      case 'follow_up_created': return '#d97706';
      case 'follow_up_completed': return '#059669';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="timeline">
      {activities.map((act) => (
        <div key={act.id} className="timeline-item">
          <div 
            className="timeline-dot" 
            style={{ 
              borderColor: getBorderColor(act.activity_type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white'
            }} 
          />
          <div className="timeline-content">
            <div className="timeline-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                {getActivityIcon(act.activity_type)}
                <span style={{ textTransform: 'capitalize', color: 'var(--color-text-main)' }}>
                  {act.activity_type.replace(/_/g, ' ')}
                </span>
              </div>
              <span>{new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              {act.description}
            </p>
            {act.actor && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', marginTop: '0.35rem' }}>
                By: {act.actor.full_name} ({act.actor.role})
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
