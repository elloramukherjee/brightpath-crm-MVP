import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Plus, 
  Loader2 
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { followUpService } from '../services/followUpService';
import { useAuth } from '../context/AuthContext';
import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import type { DashboardMetrics, Lead, FollowUp, LeadStatus, LeadSource } from '../types/crm.types';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(dashboardService.getEmptyMetrics());
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user } = useAuth();

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getMetrics();
      setMetrics(data.metrics);
      setRecentLeads(data.recentLeads);
      setUpcomingFollowUps(data.upcomingFollowUps);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCompleteFollowUp = async (item: FollowUp) => {
    const res = await followUpService.completeFollowUp(item.id, user?.id);
    if (!res.error) {
      showToast('Follow-up completed!');
      await loadDashboard();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'New': return '#0284c7';
      case 'Contacted': return '#6366f1';
      case 'Qualified': return '#059669';
      case 'Converted': return '#7c3aed';
      case 'Lost': return '#e11d48';
      default: return '#94a3b8';
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-accent-500)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Calculating admissions pipeline metrics...</p>
      </div>
    );
  }

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
          <h1>Enquiry & Admissions Dashboard</h1>
          <p className="page-subtitle">Real-time metrics strictly reconciled with your permitted student enquiries and follow-ups.</p>
        </div>
        <Link to="/leads?action=new" className="btn btn-primary">
          <Plus size={16} />
          <span>New Lead</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Total Leads</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#eff6ff', '--kpi-icon-color': '#2563eb' } as React.CSSProperties}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics.totalLeads}</div>
          <div className="kpi-subtext">Accessible student records</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#0284c7' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">New Enquiries</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#e0f2fe', '--kpi-icon-color': '#0284c7' } as React.CSSProperties}>
              <UserPlus size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics.newLeads}</div>
          <div className="kpi-subtext">Awaiting initial contact</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#7c3aed' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Converted</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#f5f3ff', '--kpi-icon-color': '#7c3aed' } as React.CSSProperties}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics.convertedLeads}</div>
          <div className="kpi-subtext">Successfully enrolled students</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#dc2626' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Overdue Follow-ups</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#fef2f2', '--kpi-icon-color': '#dc2626' } as React.CSSProperties}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: metrics.overdueFollowUps > 0 ? '#dc2626' : undefined }}>
            {metrics.overdueFollowUps}
          </div>
          <div className="kpi-subtext">Pending items past due date</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#059669' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Conversion Rate</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#ecfdf5', '--kpi-icon-color': '#059669' } as React.CSSProperties}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{metrics.conversionRate}%</div>
          <div className="kpi-subtext">Converted / Total Accessible Leads</div>
        </div>
      </div>

      {/* Visual Status & Source Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Status Distribution Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pipeline by Status</h3>
          </div>
          {metrics.totalLeads === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p className="empty-state-text">No leads in the database yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(Object.keys(metrics.statusDistribution) as LeadStatus[]).map((st) => {
                const count = metrics.statusDistribution[st];
                const pct = metrics.totalLeads > 0 ? Math.round((count / metrics.totalLeads) * 100) : 0;
                return (
                  <div key={st}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{st}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: getStatusColor(st),
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source Distribution Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Enquiries by Source</h3>
          </div>
          {metrics.totalLeads === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p className="empty-state-text">No source data recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(Object.keys(metrics.sourceDistribution) as LeadSource[]).map((src) => {
                const count = metrics.sourceDistribution[src];
                const pct = metrics.totalLeads > 0 ? Math.round((count / metrics.totalLeads) * 100) : 0;
                return (
                  <div key={src}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{src}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actionable Bottom Row: Upcoming Follow-ups & Recent Leads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Upcoming Follow-ups */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--color-accent-500)" />
              <span>Upcoming Follow-ups</span>
            </h3>
            <Link to="/followups" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {upcomingFollowUps.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p className="empty-state-text">No pending follow-ups due soon.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingFollowUps.map((f) => (
                <div 
                  key={f.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>
                      {f.lead ? f.lead.full_name : 'Lead'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.note}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-600)', marginTop: '2px' }}>
                      Due: {new Date(f.due_at).toLocaleDateString()} {new Date(f.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleCompleteFollowUp(f)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderColor: '#059669', color: '#059669' }}
                    title="Mark Done"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--color-accent-500)" />
              <span>Recent Enquiries</span>
            </h3>
            <Link to="/leads" className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p className="empty-state-text">No student leads registered yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentLeads.map((lead) => (
                <div 
                  key={lead.id}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <Link 
                      to={`/leads/${lead.id}`}
                      style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-accent-600)', textDecoration: 'none' }}
                    >
                      {lead.full_name}
                    </Link>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {lead.course_interest} • {lead.source}
                    </div>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
