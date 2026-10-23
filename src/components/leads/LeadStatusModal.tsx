import React, { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
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
  'Fee higher than student budget',
  'Enrolled with competing institute',
  'Location / travel distance too far',
  'Decided to postpone learning',
  'Not reachable after multiple attempts'
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalReason: string | undefined = undefined;
    if (targetStatus === 'Lost') {
      finalReason = reason === 'Other' ? customReason.trim() : reason;
      if (!finalReason) {
        setError('Please enter a specific reason for marking this lead as Lost.');
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

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {targetStatus === 'Lost' ? 'Mark Lead as Lost' : `Update Status to ${targetStatus}`}
          </h3>
          <button onClick={onClose} className="btn-ghost btn-sm" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Changing status from <strong>{currentStatus}</strong> to <strong>{targetStatus}</strong>.
            </p>

            {targetStatus === 'Lost' && (
              <>
                <div className="form-group">
                  <label className="form-label required">Primary Lost Reason</label>
                  <select 
                    className="form-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {COMMON_LOST_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="Other">Other (Specify below)</option>
                  </select>
                </div>

                {reason === 'Other' && (
                  <div className="form-group">
                    <label className="form-label required">Specify Reason</label>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Enter specific lost reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      required
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#dc2626',
                fontSize: '0.85rem',
                marginTop: '0.5rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn ${targetStatus === 'Lost' ? 'btn-danger' : 'btn-primary'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Confirm {targetStatus}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
