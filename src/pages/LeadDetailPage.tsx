import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus, 
  History, 
  User, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Check,
  ArrowRight,
  RotateCcw,
  Award,
  XCircle
} from 'lucide-react';
import { leadService } from '../services/leadService';
import { followUpService } from '../services/followUpService';
import { activityService } from '../services/activityService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadStatusModal } from '../components/leads/LeadStatusModal';
import { FollowUpModal } from '../components/followups/FollowUpModal';
import { ActivityTimeline } from '../components/activity/ActivityTimeline';
import type { Lead, FollowUp, Activity, LeadStatus, Profile } from '../types/crm.types';

const PIPELINE_STAGES: { status: LeadStatus; label: string; desc: string }[] = [
  { status: 'New', label: '1. New Enquiry', desc: 'Logged' },
  { status: 'Contacted', label: '2. Contacted', desc: 'Call / Email' },
  { status: 'Qualified', label: '3. Qualified', desc: 'Academic Fit' },
  { status: 'Converted', label: '4. Converted', desc: 'Enrolled' }
];

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('Lost');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAllLeadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [leadRes, followUpsRes, actsRes, staffList] = await Promise.all([
        leadService.getLeadById(id),
        followUpService.getFollowUps(id),
        activityService.getActivitiesForLead(id),
        authService.getAllProfiles()
      ]);

      if (leadRes.error || !leadRes.lead) {
        setErrorMsg(leadRes.error || 'Student lead record not found.');
      } else {
        setLead(leadRes.lead);
      }
      setFollowUps(followUpsRes.followUps);
      setActivities(actsRes.activities);
      setProfiles(staffList);
    } catch {
      setErrorMsg('Failed to load lead details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAllLeadData();
  }, [loadAllLeadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusChangeClick = (newStatus: LeadStatus) => {
    if (!lead || lead.status === newStatus) return;
    if (newStatus === 'Lost') {
      setTargetStatus('Lost');
      setIsStatusModalOpen(true);
    } else {
      leadService.updateLead(lead.id, { status: newStatus }, lead.status, user?.id).then((res) => {
        if (!res.error) {
          showToast(`Status updated to ${newStatus}.`);
          loadAllLeadData();
        } else {
          alert(`Error updating status: ${res.error}`);
        }
      });
    }
  };

  const handleConfirmStatusModal = async (status: LeadStatus, reason?: string): Promise<boolean> => {
    if (!lead) return false;
    const res = await leadService.updateLead(
      lead.id,
      { status, lost_reason: reason || null },
      lead.status,
      user?.id
    );

    if (res.error) {
      alert(`Error updating status: ${res.error}`);
      return false;
    }
    showToast(`Lead marked as ${status}.`);
    await loadAllLeadData();
    return true;
  };

  const handleSaveLead = async (
    data: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assignee'>
  ): Promise<boolean> => {
    if (!lead) return false;
    const res = await leadService.updateLead(lead.id, data, lead.status, user?.id);
    if (res.error) {
      alert(`Error updating lead: ${res.error}`);
      return false;
    }
    showToast('Lead details updated successfully.');
    await loadAllLeadData();
    return true;
  };

  const handleScheduleFollowUp = async (data: { due_at: string; note: string; assigned_to?: string | null }) => {
    if (!lead) return false;
    const res = await followUpService.createFollowUp({
      lead_id: lead.id,
      due_at: data.due_at,
      note: data.note,
      assigned_to: data.assigned_to
    }, user?.id);

    if (res.error) {
      alert(`Error scheduling follow-up: ${res.error}`);
      return false;
    }
    showToast('Follow-up scheduled successfully.');
    await loadAllLeadData();
    return true;
  };

  const handleCompleteFollowUp = async (item: FollowUp) => {
    const res = await followUpService.completeFollowUp(item.id, user?.id);
    if (res.error) {
      alert(`Error completing follow-up: ${res.error}`);
    } else {
      showToast('Follow-up marked as completed.');
      await loadAllLeadData();
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    if (window.confirm(`Are you sure you want to delete lead "${lead.full_name}"?`)) {
      const res = await leadService.deleteLead(lead.id);
      if (res.error) {
        alert(`Failed to delete lead: ${res.error}`);
      } else {
        alert('Lead successfully removed.');
        navigate('/leads');
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <Loader2 size={36} className="animate-spin" color="var(--color-accent-500)" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading lead profile and history...</p>
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div>
        <Link to="/leads" className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex', gap: '0.35rem' }}>
          <ArrowLeft size={16} />
          <span>Back to All Leads</span>
        </Link>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Student Record Not Found</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{errorMsg || 'The requested student lead could not be retrieved.'}</p>
          <Link to="/leads" className="btn btn-primary">Return to Leads List</Link>
        </div>
      </div>
    );
  }

  const assigneeName = lead.assignee?.full_name || profiles.find((p) => p.id === lead.assigned_to)?.full_name || 'Unassigned';

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

      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/leads" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', gap: '0.35rem' }}>
          <ArrowLeft size={16} />
          <span>Back to All Leads</span>
        </Link>
      </div>

      {/* Main Lead Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem' }}>{lead.full_name}</h1>
              <LeadStatusBadge status={lead.status} />
              {lead.status === 'Lost' && lead.lost_reason && (
                <span style={{ fontSize: '0.8rem', color: '#be123c', backgroundColor: '#ffe4e6', padding: '2px 8px', borderRadius: '4px' }}>
                  Reason: {lead.lost_reason}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={15} color="var(--color-accent-500)" />
                <a href={`tel:${lead.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{lead.phone}</a>
              </div>
              {lead.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={15} color="var(--color-accent-500)" />
                  <a href={`mailto:${lead.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{lead.email}</a>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <BookOpen size={15} color="var(--color-accent-500)" />
                <span>{lead.course_interest}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={15} color="var(--color-accent-500)" />
                <span>Assigned: {assigneeName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} color="var(--color-accent-500)" />
                <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setIsEditModalOpen(true)} className="btn btn-secondary btn-sm">
              <Edit size={14} />
              <span>Edit Details</span>
            </button>
            <button 
              onClick={() => setIsFollowUpModalOpen(true)} 
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>Schedule Follow-up</span>
            </button>
            <button 
              onClick={handleDeleteLead}
              className="btn-ghost btn-sm"
              title="Delete lead"
              style={{ color: '#ef4444', padding: '0.35rem' }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Visual Pipeline Funnel Stepper */}
        {(() => {
          const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.status === lead.status);
          const isLost = lead.status === 'Lost';
          const progressPercent = isLost
            ? 0
            : currentStageIndex >= 0
            ? (currentStageIndex / (PIPELINE_STAGES.length - 1)) * 100
            : 0;

          return (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Admissions Pipeline Stage:
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {isLost ? 'Enquiry Inactive (Lost)' : `Stage ${Math.max(1, currentStageIndex + 1)} of 4: ${lead.status}`}
                </span>
              </div>

              <div className="pipeline-stepper">
                <div className="stepper-track-line">
                  <div className="stepper-track-fill" style={{ width: `${progressPercent}%` }} />
                </div>

                {PIPELINE_STAGES.map((stage, idx) => {
                  let stageState = 'upcoming';
                  if (isLost) {
                    stageState = 'upcoming';
                  } else if (idx < currentStageIndex) {
                    stageState = 'completed';
                  } else if (idx === currentStageIndex) {
                    stageState = 'active';
                  }

                  return (
                    <div key={stage.status} className={`stepper-stage ${stageState}`}>
                      <div className="stepper-circle">
                        {stageState === 'completed' ? (
                          <Check size={18} strokeWidth={3} />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="stepper-label">{stage.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Lost Lead Special Banner */}
              {isLost && (
                <div className="lost-lead-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
                        Enquiry Marked as Lost
                        {lead.lost_reason && (
                          <span className="lost-lead-reason-tag">
                            Reason: {lead.lost_reason}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '0.2rem' }}>
                        Recorded reason: "{lead.lost_reason || 'Unspecified'}"
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleStatusChangeClick('Contacted')} 
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: '#fca5a5', color: '#991b1b', backgroundColor: '#ffffff', borderRadius: '8px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Reopen Enquiry (Move to Contacted)</span>
                  </button>
                </div>
              )}

              {/* Context-Aware Action Advance Buttons */}
              <div style={{ 
                marginTop: '1.25rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#64748b' }}>
                    Recommended Action:
                  </span>

                  {lead.status === 'New' && (
                    <button 
                      onClick={() => handleStatusChangeClick('Contacted')}
                      className="btn btn-primary btn-sm"
                      style={{ borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span>Mark as Contacted</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {lead.status === 'Contacted' && (
                    <button 
                      onClick={() => handleStatusChangeClick('Qualified')}
                      className="btn btn-primary btn-sm"
                      style={{ borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span>Advance to Qualified</span>
                      <ArrowRight size={14} />
                    </button>
                  )}

                  {lead.status === 'Qualified' && (
                    <button 
                      onClick={() => handleStatusChangeClick('Converted')}
                      className="btn btn-primary btn-sm"
                      style={{ 
                        borderRadius: '8px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.4rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Award size={15} />
                      <span>Confirm Admission (Convert Lead)</span>
                    </button>
                  )}

                  {lead.status === 'Converted' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#065f46', fontWeight: 700, fontSize: '0.875rem' }}>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Admission Confirmed & Enrolled!</span>
                    </div>
                  )}

                  {lead.status !== 'Lost' && (
                    <button 
                      onClick={() => handleStatusChangeClick('Lost')}
                      className="btn btn-secondary btn-sm"
                      style={{ borderRadius: '8px', color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      <XCircle size={14} />
                      <span>Mark as Lost</span>
                    </button>
                  )}
                </div>

                {/* Quick Override Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>Jump to:</span>
                  <select 
                    className="form-select"
                    value={lead.status}
                    onChange={(e) => handleStatusChangeClick(e.target.value as LeadStatus)}
                    style={{ width: 'auto', fontSize: '0.8rem', padding: '0.25rem 0.6rem', height: '32px' }}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Notes preview if available */}
        {lead.notes && (
          <div style={{ 
            marginTop: '1.25rem', 
            padding: '1rem', 
            backgroundColor: 'var(--color-bg-subtle)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.9rem'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              Enquiry Notes:
            </strong>
            <p style={{ margin: 0, color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Two Column Layout: Follow-ups on Left, Activity Timeline on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Scheduled Follow-ups Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--color-accent-500)" />
              <span>Follow-ups ({followUps.length})</span>
            </h3>
            <button 
              onClick={() => setIsFollowUpModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              <span>Schedule</span>
            </button>
          </div>

          {followUps.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p className="empty-state-text">No follow-ups scheduled for this student lead.</p>
              <button 
                onClick={() => setIsFollowUpModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                Schedule First Follow-up
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {followUps.map((item) => {
                const isOverdue = followUpService.isOverdue(item);
                return (
                  <div 
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: isOverdue ? '#fff5f5' : item.status === 'completed' ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.status === 'completed' ? (
                          <span className="badge badge-completed">Completed</span>
                        ) : isOverdue ? (
                          <span className="badge badge-overdue">OVERDUE</span>
                        ) : (
                          <span className="badge badge-pending">Pending</span>
                        )}
                        <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>
                          {new Date(item.due_at).toLocaleDateString()} at {new Date(item.due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {item.status === 'pending' && (
                        <button 
                          onClick={() => handleCompleteFollowUp(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: '#059669', color: '#059669' }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>

                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                      {item.note}
                    </p>

                    {item.completed_at && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                        Resolved: {new Date(item.completed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Timeline Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="var(--color-accent-500)" />
              <span>Activity History ({activities.length})</span>
            </h3>
          </div>
          <ActivityTimeline activities={activities} />
        </div>
      </div>

      {/* Edit Lead Modal */}
      <LeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveLead}
        initialData={lead}
        profiles={profiles}
        currentUserId={user?.id}
      />

      {/* Follow-up Schedule Modal */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        leadId={lead.id}
        leadName={lead.full_name}
        onSave={handleScheduleFollowUp}
        profiles={profiles}
        currentUserId={user?.id}
      />

      {/* Lost Status Modal */}
      <LeadStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        targetStatus={targetStatus}
        currentStatus={lead.status}
        onConfirm={handleConfirmStatusModal}
      />
    </div>
  );
};
