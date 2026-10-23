import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Loader2, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { followUpService } from '../services/followUpService';
import { useAuth } from '../context/AuthContext';
import type { FollowUp } from '../types/crm.types';

export const FollowUpsPage: React.FC = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'pending' | 'completed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await followUpService.getFollowUps();
      if (res.followUps) {
        setFollowUps(res.followUps);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkComplete = async (item: FollowUp) => {
    const res = await followUpService.completeFollowUp(item.id, user?.id);
    if (res.error) {
      alert(`Error completing follow-up: ${res.error}`);
    } else {
      showToast(`Follow-up marked as completed!`);
      await loadData();
    }
  };

  // Metrics counts
  const overdueCount = followUps.filter((f) => followUpService.isOverdue(f)).length;
  const pendingCount = followUps.filter((f) => f.status === 'pending' && !followUpService.isOverdue(f)).length;
  const completedCount = followUps.filter((f) => f.status === 'completed').length;

  const filteredItems = followUps.filter((f) => {
    if (filterTab === 'overdue') return followUpService.isOverdue(f);
    if (filterTab === 'pending') return f.status === 'pending' && !followUpService.isOverdue(f);
    if (filterTab === 'completed') return f.status === 'completed';
    return true;
  });

  return (
    <div>
      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-title-group">
          <h1>Follow-up Management Queue</h1>
          <p className="page-subtitle">Track, prioritize, and complete scheduled touchpoints with prospective students.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div 
          className="card" 
          style={{ 
            borderLeft: '4px solid #dc2626', 
            cursor: 'pointer',
            backgroundColor: filterTab === 'overdue' ? '#fef2f2' : 'var(--color-bg-surface)' 
          }}
          onClick={() => setFilterTab('overdue')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="kpi-label">Overdue Follow-ups</span>
              <div className="kpi-value" style={{ color: '#dc2626' }}>{overdueCount}</div>
              <div className="kpi-subtext">Requires immediate outreach</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        <div 
          className="card" 
          style={{ 
            borderLeft: '4px solid #d97706', 
            cursor: 'pointer',
            backgroundColor: filterTab === 'pending' ? '#fffbeb' : 'var(--color-bg-surface)' 
          }}
          onClick={() => setFilterTab('pending')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="kpi-label">Upcoming / Scheduled</span>
              <div className="kpi-value" style={{ color: '#d97706' }}>{pendingCount}</div>
              <div className="kpi-subtext">Due today or upcoming</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div 
          className="card" 
          style={{ 
            borderLeft: '4px solid #059669', 
            cursor: 'pointer',
            backgroundColor: filterTab === 'completed' ? '#ecfdf5' : 'var(--color-bg-surface)' 
          }}
          onClick={() => setFilterTab('completed')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="kpi-label">Completed</span>
              <div className="kpi-value" style={{ color: '#059669' }}>{completedCount}</div>
              <div className="kpi-subtext">Successfully closed touchpoints</div>
            </div>
            <div className="kpi-icon-wrapper" style={{ background: '#d1fae5', color: '#059669' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterTab('all')} 
          className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Items ({followUps.length})
        </button>
        <button 
          onClick={() => setFilterTab('overdue')} 
          className={`btn btn-sm ${filterTab === 'overdue' ? 'btn-danger' : 'btn-secondary'}`}
        >
          Overdue ({overdueCount})
        </button>
        <button 
          onClick={() => setFilterTab('pending')} 
          className={`btn btn-sm ${filterTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Upcoming ({pendingCount})
        </button>
        <button 
          onClick={() => setFilterTab('completed')} 
          className={`btn btn-sm ${filterTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Follow-ups Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Student Lead</th>
              <th>Scheduled Due Date & Time</th>
              <th>Action Agenda / Note</th>
              <th>Assignee</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--color-accent-500)" />
                    <span style={{ color: 'var(--color-text-muted)' }}>Loading follow-ups...</span>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <CalendarClock size={28} />
                    </div>
                    <h4 className="empty-state-title">No follow-ups found in this view</h4>
                    <p className="empty-state-text">
                      {filterTab === 'overdue' 
                        ? 'Great job! You have zero overdue follow-ups.' 
                        : 'No follow-up items match the selected filter tab.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isOverdue = followUpService.isOverdue(item);
                return (
                  <tr key={item.id} style={{ backgroundColor: isOverdue ? '#fff5f5' : undefined }}>
                    <td>
                      {item.status === 'completed' ? (
                        <span className="badge badge-completed">
                          <CheckCircle2 size={12} />
                          Completed
                        </span>
                      ) : isOverdue ? (
                        <span className="badge badge-overdue">
                          <AlertTriangle size={12} />
                          OVERDUE
                        </span>
                      ) : (
                        <span className="badge badge-pending">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td>
                      {item.lead ? (
                        <div>
                          <Link 
                            to={`/leads/${item.lead.id}`}
                            style={{ fontWeight: 700, color: 'var(--color-accent-600)', textDecoration: 'none' }}
                          >
                            {item.lead.full_name}
                          </Link>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {item.lead.course_interest}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-subtle)' }}>Lead #{item.lead_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: isOverdue ? 700 : 500, color: isOverdue ? '#b91c1c' : 'var(--color-text-main)' }}>
                        {new Date(item.due_at).toLocaleDateString()} at {new Date(item.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {item.completed_at && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                          Completed on: {new Date(item.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-main)', maxWidth: '320px' }}>
                        {item.note}
                      </p>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {item.assignee ? item.assignee.full_name : 'Staff Member'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.status === 'pending' && (
                          <button 
                            onClick={() => handleMarkComplete(item)}
                            className="btn btn-secondary btn-sm"
                            title="Mark as completed"
                            style={{ gap: '0.35rem', borderColor: '#059669', color: '#059669' }}
                          >
                            <CheckCircle size={14} />
                            <span>Mark Complete</span>
                          </button>
                        )}
                        <Link 
                          to={`/leads/${item.lead_id}`} 
                          className="btn-ghost btn-sm"
                          title="View student profile"
                          style={{ padding: '0.35rem' }}
                        >
                          <ArrowUpRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
