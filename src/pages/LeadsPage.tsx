import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  Users, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  Phone, 
  Mail, 
  BookOpen, 
  Calendar,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadStatusModal } from '../components/leads/LeadStatusModal';
import type { Lead, LeadStatus, LeadSource, Profile } from '../types/crm.types';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [statusModalLead, setStatusModalLead] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('Contacted');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // 300ms Debounce effect on search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [leadsRes, staffList] = await Promise.all([
        leadService.getLeads({
          search: debouncedSearchTerm,
          status: statusFilter,
          source: sourceFilter,
          assigned_to: assigneeFilter
        }),
        authService.getAllProfiles()
      ]);

      if (leadsRes.error) {
        setErrorMsg(leadsRes.error);
      } else {
        setLeads(leadsRes.leads);
        // If no filters active, update baseline totalCount
        if (!debouncedSearchTerm && !statusFilter && !sourceFilter && !assigneeFilter) {
          setTotalCount(leadsRes.leads.length);
        }
      }
      setProfiles(staffList);
    } catch {
      setErrorMsg('Failed to fetch leads from database.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, sourceFilter, assigneeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check URL param if opened via ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingLead(null);
      setIsModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('');
    setSourceFilter('');
    setAssigneeFilter('');
  };

  const handleRemoveFilter = (filterKey: 'search' | 'status' | 'source' | 'assignee') => {
    switch (filterKey) {
      case 'search':
        setSearchTerm('');
        setDebouncedSearchTerm('');
        break;
      case 'status':
        setStatusFilter('');
        break;
      case 'source':
        setSourceFilter('');
        break;
      case 'assignee':
        setAssigneeFilter('');
        break;
    }
  };

  // Active filter indicators
  const activeFiltersCount = [
    Boolean(debouncedSearchTerm.trim()),
    Boolean(statusFilter),
    Boolean(sourceFilter),
    Boolean(assigneeFilter)
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0;
  const currentAssigneeName = profiles.find((p) => p.id === assigneeFilter)?.full_name || 'Staff Member';

  const handleSaveLead = async (
    data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assignee'>
  ): Promise<boolean> => {
    if (editingLead) {
      const res = await leadService.updateLead(
        editingLead.id,
        data,
        editingLead.status,
        user?.id
      );
      if (res.error) {
        alert(`Error updating lead: ${res.error}`);
        return false;
      }
      showToast(`Lead "${data.full_name}" updated successfully.`);
    } else {
      const res = await leadService.createLead(data, user?.id);
      if (res.error) {
        alert(`Error creating lead: ${res.error}`);
        return false;
      }
      showToast(`New lead "${data.full_name}" created.`);
    }
    await loadData();
    return true;
  };

  const handleStatusChangeClick = (lead: Lead, newStatus: LeadStatus) => {
    if (lead.status === newStatus) return;
    if (newStatus === 'Lost') {
      setStatusModalLead(lead);
      setTargetStatus('Lost');
    } else {
      // Direct quick change for non-lost statuses
      leadService.updateLead(lead.id, { status: newStatus }, lead.status, user?.id).then((res) => {
        if (!res.error) {
          showToast(`Status updated to ${newStatus}.`);
          loadData();
        } else {
          alert(`Failed to update status: ${res.error}`);
        }
      });
    }
  };

  const handleConfirmStatusModal = async (status: LeadStatus, reason?: string): Promise<boolean> => {
    if (!statusModalLead) return false;
    const res = await leadService.updateLead(
      statusModalLead.id,
      { status, lost_reason: reason || null },
      statusModalLead.status,
      user?.id
    );

    if (res.error) {
      alert(`Error updating status: ${res.error}`);
      return false;
    }
    showToast(`Lead marked as ${status}.`);
    await loadData();
    return true;
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (window.confirm(`Are you sure you want to delete lead "${lead.full_name}"? This action cannot be undone.`)) {
      const res = await leadService.deleteLead(lead.id);
      if (res.error) {
        alert(`Failed to delete lead: ${res.error}`);
      } else {
        showToast(`Lead "${lead.full_name}" was deleted.`);
        await loadData();
      }
    }
  };

  const getAssigneeName = (lead: Lead): string => {
    if (lead.assignee) return lead.assignee.full_name;
    const matched = profiles.find((p) => p.id === lead.assigned_to);
    return matched ? matched.full_name : 'Unassigned';
  };

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
          <h1>Student Leads</h1>
          <p className="page-subtitle">Track, filter, and manage student enquiries across courses and intake batches.</p>
        </div>
        <button 
          onClick={() => { setEditingLead(null); setIsModalOpen(true); }} 
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>Add New Lead</span>
        </button>
      </div>

      {/* Search & Multi-criteria Filters */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by student name, phone, email, course..." 
            className="form-input search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={handleClearSearch} 
              className="search-clear-btn"
              title="Clear search query"
              aria-label="Clear search input"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select 
          className="form-select" 
          style={{ width: 'auto', minWidth: '140px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')}
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Converted">Converted</option>
          <option value="Lost">Lost</option>
        </select>

        <select 
          className="form-select" 
          style={{ width: 'auto', minWidth: '140px' }}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as LeadSource | '')}
        >
          <option value="">All Sources</option>
          <option value="Website">Website</option>
          <option value="Call">Call</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Referral">Referral</option>
          <option value="Social Media">Social Media</option>
          <option value="Other">Other</option>
        </select>

        {profiles.length > 0 && (
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="">All Counsellors</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button 
            onClick={handleResetFilters} 
            className="btn btn-secondary btn-sm" 
            title="Reset all filters"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
            <span className="filter-count-badge">{activeFiltersCount}</span>
          </button>
        )}
      </div>

      {/* Dynamic Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="filter-chips-bar">
          <span className="filter-chips-label">Active Filters:</span>
          
          {debouncedSearchTerm.trim() && (
            <span className="filter-chip chip-search">
              <span>Keyword: "{debouncedSearchTerm}"</span>
              <button 
                type="button" 
                onClick={() => handleRemoveFilter('search')} 
                className="filter-chip-remove"
                aria-label="Remove search filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {statusFilter && (
            <span className="filter-chip chip-status">
              <span>Status: {statusFilter}</span>
              <button 
                type="button" 
                onClick={() => handleRemoveFilter('status')} 
                className="filter-chip-remove"
                aria-label="Remove status filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {sourceFilter && (
            <span className="filter-chip chip-source">
              <span>Source: {sourceFilter}</span>
              <button 
                type="button" 
                onClick={() => handleRemoveFilter('source')} 
                className="filter-chip-remove"
                aria-label="Remove source filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {assigneeFilter && (
            <span className="filter-chip chip-counsellor">
              <span>Counsellor: {currentAssigneeName}</span>
              <button 
                type="button" 
                onClick={() => handleRemoveFilter('assignee')} 
                className="filter-chip-remove"
                aria-label="Remove counsellor filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          <button 
            type="button" 
            onClick={handleResetFilters}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '0.775rem', 
              color: '#ef4444', 
              fontWeight: 600, 
              cursor: 'pointer', 
              textDecoration: 'underline',
              marginLeft: '0.25rem' 
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Counter Meta Header */}
      <div className="results-meta-header">
        <div className="results-counter-text">
          Showing <span className="results-counter-highlight">{leads.length}</span>
          {totalCount > 0 && <span> of {totalCount}</span>} student {leads.length === 1 ? 'enquiry' : 'enquiries'}
        </div>
        {hasActiveFilters && (
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Filtered by {activeFiltersCount} {activeFiltersCount === 1 ? 'criterion' : 'criteria'}
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecdd3',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          color: '#be123c',
          marginBottom: '1rem',
          fontSize: '0.875rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Table Container */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Contact Details</th>
              <th>Course Interest</th>
              <th>Source</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--color-accent-500)" />
                    <span style={{ color: 'var(--color-text-muted)' }}>Loading student leads...</span>
                  </div>
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Users size={28} />
                    </div>
                    <h4 className="empty-state-title">No leads match your criteria</h4>
                    <p className="empty-state-text">
                      {hasActiveFilters
                        ? 'Try clearing your active filters or adjusting your search keywords.'
                        : 'Get started by creating your first student enquiry lead.'}
                    </p>
                    {hasActiveFilters ? (
                      <button 
                        onClick={handleResetFilters} 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
                      >
                        <RotateCcw size={14} />
                        <span>Clear All Filters</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setEditingLead(null); setIsModalOpen(true); }} 
                        className="btn btn-primary btn-sm"
                      >
                        <Plus size={15} />
                        <span>Add First Lead</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <Link 
                      to={`/leads/${lead.id}`} 
                      style={{ fontWeight: 700, color: 'var(--color-accent-600)', textDecoration: 'none' }}
                    >
                      {lead.full_name}
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.825rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={12} color="var(--color-text-subtle)" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}>
                          <Mail size={12} color="var(--color-text-subtle)" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                      <BookOpen size={13} color="var(--color-accent-500)" />
                      <span>{lead.course_interest}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      backgroundColor: 'var(--color-bg-subtle)', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      color: 'var(--color-text-muted)',
                      fontWeight: 500
                    }}>
                      {lead.source}
                    </span>
                  </td>
                  <td>
                    {/* Quick status dropdown selector with lost reason subtitle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LeadStatusBadge status={lead.status} />
                        <select 
                          value={lead.status}
                          onChange={(e) => handleStatusChangeClick(lead, e.target.value as LeadStatus)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 4px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer'
                          }}
                          aria-label={`Change status for ${lead.full_name}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Converted">Converted</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                      {lead.status === 'Lost' && lead.lost_reason && (
                        <span 
                          style={{ 
                            fontSize: '0.725rem', 
                            color: '#be123c', 
                            backgroundColor: '#ffe4e6', 
                            padding: '1px 6px', 
                            borderRadius: '4px', 
                            maxWidth: '180px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }} 
                          title={lead.lost_reason}
                        >
                          {lead.lost_reason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                      {getAssigneeName(lead)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                      <Calendar size={12} />
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Link 
                        to={`/leads/${lead.id}`} 
                        className="btn-ghost btn-sm" 
                        title="View details & follow-ups"
                        style={{ padding: '0.35rem' }}
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                      <button 
                        onClick={() => { setEditingLead(lead); setIsModalOpen(true); }}
                        className="btn-ghost btn-sm"
                        title="Edit lead"
                        style={{ padding: '0.35rem' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteLead(lead)}
                        className="btn-ghost btn-sm"
                        title="Delete lead"
                        style={{ padding: '0.35rem', color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLead}
        initialData={editingLead}
        profiles={profiles}
        currentUserId={user?.id}
      />

      {/* Lost Status Reason Modal */}
      <LeadStatusModal
        isOpen={Boolean(statusModalLead)}
        onClose={() => setStatusModalLead(null)}
        targetStatus={targetStatus}
        currentStatus={statusModalLead?.status || 'New'}
        onConfirm={handleConfirmStatusModal}
      />
    </div>
  );
};
