import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Lead, LeadSource, LeadStatus, Profile } from '../../types/crm.types';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assignee'>) => Promise<boolean>;
  initialData?: Lead | null;
  profiles: Profile[];
  currentUserId?: string;
}

const COURSES = [
  'Full Stack Web Development',
  'Data Science & AI Masterclass',
  'Cloud DevOps Engineering',
  'UI/UX Design Bootcamp',
  'Cybersecurity Essentials',
  'Digital Marketing Strategy'
];

const SOURCES: LeadSource[] = ['Website', 'Call', 'Walk-in', 'Referral', 'Social Media', 'Other'];
const STATUSES: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  profiles,
  currentUserId
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseInterest, setCourseInterest] = useState(COURSES[0]);
  const [source, setSource] = useState<LeadSource>('Website');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [lostReason, setLostReason] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.full_name);
      setPhone(initialData.phone);
      setEmail(initialData.email || '');
      setCourseInterest(initialData.course_interest);
      setSource(initialData.source);
      setStatus(initialData.status);
      setAssignedTo(initialData.assigned_to || '');
      setNotes(initialData.notes || '');
      setLostReason(initialData.lost_reason || '');
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setCourseInterest(COURSES[0]);
      setSource('Website');
      setStatus('New');
      setAssignedTo(currentUserId || (profiles.length > 0 ? profiles[0].id : ''));
      setNotes('');
      setLostReason('');
    }
    setErrors({});
  }, [initialData, isOpen, currentUserId, profiles]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Student full name is required.';
    }

    if (!phone.trim()) {
      errs.phone = 'Contact phone number is required.';
    } else if (phone.trim().length < 8) {
      errs.phone = 'Please enter a valid phone number (at least 8 digits).';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address.';
      }
    }

    if (status === 'Lost' && !lostReason.trim()) {
      errs.lostReason = 'Please provide a reason when marking lead as Lost.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const success = await onSave({
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() ? email.trim() : null,
      course_interest: courseInterest,
      source,
      status,
      lost_reason: status === 'Lost' ? lostReason.trim() : null,
      assigned_to: assignedTo || null,
      created_by: currentUserId || null,
      notes: notes.trim() ? notes.trim() : null
    });
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {initialData ? 'Edit Student Lead' : 'Create New Student Lead'}
          </h3>
          <button onClick={onClose} className="btn-ghost btn-sm" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label required">Student Full Name</label>
              <input
                type="text"
                className={`form-input ${errors.fullName ? 'error' : ''}`}
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {errors.fullName && <div className="form-error">{errors.fullName}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Phone Number</label>
                <input
                  type="tel"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Course Interest</label>
                <select
                  className="form-select"
                  value={courseInterest}
                  onChange={(e) => setCourseInterest(e.target.value)}
                >
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Enquiry Source</label>
                <select
                  className="form-select"
                  value={source}
                  onChange={(e) => setSource(e.target.value as LeadSource)}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Counsellor</label>
                <select
                  className="form-select"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {status === 'Lost' && (
              <div className="form-group">
                <label className="form-label required">Reason for Marking Lost</label>
                <input
                  type="text"
                  className={`form-input ${errors.lostReason ? 'error' : ''}`}
                  placeholder="e.g. Schedule clash, fee out of budget, enrolled elsewhere..."
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                />
                {errors.lostReason && <div className="form-error">{errors.lostReason}</div>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Notes & Conversation Background</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Key details from initial enquiry, student questions, schedule constraints..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Update Lead' : 'Save Lead'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
