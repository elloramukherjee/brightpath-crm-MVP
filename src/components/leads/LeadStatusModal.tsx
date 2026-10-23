import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import type { LeadStatus } from '../../types/crm.types';

interface LeadStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStatus: LeadStatus;
  currentStatus: LeadStatus;
  onConfirm: (status: LeadStatus, reason?: string) => Promise<boolean>;
}

const COMMON_LOST_REASONS = [
  'Timings clash with college/work schedule',
  'Course fee exceeds student budget',
  'Enrolled with competing institute',
  'Location / travel distance too far',
  'Decided to postpone learning to next semester',
  'Unreachable after multiple attempts',
  'Other'
];

export const LeadStatusModal: React.FC<LeadStatusModalProps> = ({
  isOpen,
  onClose,
  targetStatus,
  currentStatus,
  onConfirm
}) => {
  const [reason, setReason] = useState(COMMON_LOST_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason(COMMON_LOST_REASONS[0]);
      setCustomReason('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, targetStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalReason: string | undefined = undefined;
    if (targetStatus === 'Lost') {
      finalReason = reason === 'Other' ? customReason.trim() : reason;
      if (!finalReason) {
        setError('Please provide a specific explanation for marking this enquiry as Lost.');
        return;
      }
    }

    setIsSubmitting(true);
    const success = await onConfirm(targetStatus, finalReason);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  const isLost = targetStatus === 'Lost';

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '520px', borderRadius: '16px' }}
      >
        <div 
          className="modal-header"
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: isLost ? '#fef2f2' : undefined
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: isLost ? '#fee2e2' : '#eff6ff',
              color: isLost ? '#dc2626' : '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isLost ? <AlertTriangle size={20} /> : <ArrowRight size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {isLost ? 'Mark Student Enquiry as Lost' : `Update Status to ${targetStatus}`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                {isLost ? 'Mandatory protocol: record reason for dropped enquiry' : `Transitioning from ${currentStatus} to ${targetStatus}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm" aria-label="Close modal" style={{ padding: '0.4rem', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" style={{ padding: '1.75rem' }}>
            <div style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.875rem'
            }}>
              <span style={{ color: '#64748b' }}>Current Status:</span>
              <strong style={{ color: '#0f172a' }}>{currentStatus}</strong>
              <ArrowRight size={14} color="#94a3b8" />
              <span style={{ color: '#64748b' }}>New Status:</span>
              <strong style={{ color: isLost ? '#dc2626' : '#2563eb' }}>{targetStatus}</strong>
            </div>

            {isLost && (
              <>
                <div className="form-group">
                  <label className="form-label required">Primary Reason for Dropping Enquiry</label>
                  <select 
                    className="form-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{ fontWeight: 500 }}
                  >
                    {COMMON_LOST_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {reason === 'Other' && (
                  <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
                    <label className="form-label required">Custom Explanation / Notes</label>
                    <textarea 
                      className="form-textarea"
                      rows={3}
                      placeholder="Specify the reason why this prospective student did not enroll..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="auth-error-box" role="alert" style={{ marginTop: '0.75rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid #e2e8f0' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary" 
              disabled={isSubmitting}
              style={{ borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn ${isLost ? 'btn-danger' : 'btn-primary'}`}
              disabled={isSubmitting}
              style={{ borderRadius: '8px', minWidth: '140px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>{isLost ? 'Confirm Lost' : `Set as ${targetStatus}`}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
