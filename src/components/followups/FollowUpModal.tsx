import React, { useState } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import type { Profile } from '../../types/crm.types';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  onSave: (data: { due_at: string; note: string; assigned_to?: string | null }) => Promise<boolean>;
  profiles: Profile[];
  currentUserId?: string;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  leadId: _leadId,
  leadName,
  onSave,
  profiles,
  currentUserId
}) => {
  // Default to tomorrow 10:00 AM
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  const [dueDate, setDueDate] = useState(getDefaultDateTime());
  const [note, setNote] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUserId || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!note.trim()) {
      setError('Please provide a note or agenda for the follow-up.');
      return;
    }

    if (!dueDate) {
      setError('Please select a scheduled due date and time.');
      return;
    }

    setIsSubmitting(true);
    const success = await onSave({
      due_at: new Date(dueDate).toISOString(),
      note: note.trim(),
      assigned_to: assignedTo || null
    });
    setIsSubmitting(false);

    if (success) {
      setNote('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Schedule Follow-up
          </h3>
          <button onClick={onClose} className="btn-ghost btn-sm" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem'
            }}>
              Following up with: <strong>{leadName}</strong>
            </div>

            <div className="form-group">
              <label className="form-label required">Due Date & Time</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="datetime-local"
                  required
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select 
                className="form-select"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">-- Unassigned --</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">Action Agenda / Note</label>
              <textarea 
                required
                className="form-textarea"
                rows={3}
                placeholder="e.g. Call student to discuss scholarship options, follow up on curriculum questions..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <div className="form-error" style={{ marginBottom: '0.5rem' }}>{error}</div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Clock size={16} />
                  <span>Schedule Follow-up</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
