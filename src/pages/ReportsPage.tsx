import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  PieChart, 
  Users, 
  CheckCircle2, 
  FileText,
  Loader2 
} from 'lucide-react';
import { leadService } from '../services/leadService';
import type { Lead, LeadSource, LeadStatus } from '../types/crm.types';

interface SourceAnalytics {
  source: LeadSource;
  total: number;
  converted: number;
  conversionRate: number;
}

export const ReportsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    leadService.getLeads().then((res) => {
      if (res.leads) {
        setLeads(res.leads);
      }
      setIsLoading(false);
    });
  }, []);

  const totalLeads = leads.length;
  const convertedCount = leads.filter((l) => l.status === 'Converted').length;
  const overallRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100 * 10) / 10 : 0;

  // Status Funnel
  const funnelStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted'];
  const statusCounts = funnelStatuses.map((st) => ({
    status: st,
    count: leads.filter((l) => l.status === st).length
  }));
  const lostCount = leads.filter((l) => l.status === 'Lost').length;

  // Source Analytics
  const sources: LeadSource[] = ['Website', 'Call', 'Walk-in', 'Referral', 'Social Media', 'Other'];
  const sourceAnalytics: SourceAnalytics[] = sources.map((src) => {
    const srcLeads = leads.filter((l) => l.source === src);
    const converted = srcLeads.filter((l) => l.status === 'Converted').length;
    const rate = srcLeads.length > 0 ? Math.round((converted / srcLeads.length) * 100 * 10) / 10 : 0;
    return {
      source: src,
      total: srcLeads.length,
      converted,
      conversionRate: rate
    };
  }).sort((a, b) => b.total - a.total);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-accent-500)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Generating institute analytics report...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Admissions Analytics & Source Reports</h1>
          <p className="page-subtitle">Standardized conversion funnel metrics and marketing acquisition channel effectiveness.</p>
        </div>
      </div>

      {/* KPI Overview Summary */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Total Enquiries</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#eff6ff', '--kpi-icon-color': '#2563eb' } as React.CSSProperties}>
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">{totalLeads}</div>
          <div className="kpi-subtext">All pipeline submissions</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#7c3aed' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Admissions Confirmed</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#f5f3ff', '--kpi-icon-color': '#7c3aed' } as React.CSSProperties}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">{convertedCount}</div>
          <div className="kpi-subtext">Enrolled students</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#059669' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Overall Conversion Rate</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#ecfdf5', '--kpi-icon-color': '#059669' } as React.CSSProperties}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value">{overallRate}%</div>
          <div className="kpi-subtext">Converted / Total Accessible Leads</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#be123c' } as React.CSSProperties}>
          <div className="kpi-header">
            <span className="kpi-label">Lost Enquiries</span>
            <div className="kpi-icon-wrapper" style={{ '--kpi-icon-bg': '#ffe4e6', '--kpi-icon-color': '#be123c' } as React.CSSProperties}>
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-value">{lostCount}</div>
          <div className="kpi-subtext">Closed without enrollment</div>
        </div>
      </div>

      {/* Funnel Progression Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-accent-500)" />
            <span>Admissions Progression Funnel</span>
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {statusCounts.map((item, idx) => {
            const pctOfTotal = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
            return (
              <div 
                key={item.status}
                style={{
                  backgroundColor: 'var(--color-bg-subtle)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Stage {idx + 1}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0' }}>
                  {item.status}
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent-600)' }}>
                  {item.count}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {pctOfTotal}% of all enquiries
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Channel Effectiveness Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="var(--color-accent-500)" />
            <span>Acquisition Channel Effectiveness</span>
          </h3>
        </div>

        <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Enquiry Channel / Source</th>
                <th>Total Leads</th>
                <th>Share of Pipeline</th>
                <th>Admissions (Converted)</th>
                <th>Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {sourceAnalytics.map((item) => {
                const sharePct = totalLeads > 0 ? Math.round((item.total / totalLeads) * 100) : 0;
                return (
                  <tr key={item.source}>
                    <td style={{ fontWeight: 600 }}>{item.source}</td>
                    <td>{item.total}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${sharePct}%`, height: '100%', backgroundColor: '#3b82f6' }} />
                        </div>
                        <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>{sharePct}%</span>
                      </div>
                    </td>
                    <td>{item.converted}</td>
                    <td>
                      <span style={{ 
                        fontWeight: 700, 
                        color: item.conversionRate >= 20 ? '#059669' : item.conversionRate > 0 ? '#2563eb' : 'var(--color-text-subtle)' 
                      }}>
                        {item.conversionRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
