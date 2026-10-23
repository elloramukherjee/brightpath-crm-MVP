import React, { useState, useEffect } from 'react';
import { 
  X, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  BookOpen, 
  Globe, 
  UserCheck, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
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
  const [hasSubmitted, setHasSubmitted] = useState(false);
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
    setHasSubmitted(false);
  }, [initialData, isOpen, currentUserId, profiles]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Student full name is required.';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters.';
    }

    if (!phone.trim()) {
      errs.phone = 'Contact phone number is required.';
    } else if (phone.trim().replace(/\D/g, '').length < 8) {
      errs.phone = 'Please enter a valid phone number (at least 8 digits).';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address (e.g. name@domain.com).';
      }
    }

    if (status === 'Lost' && !lostReason.trim()) {
      errs.lostReason = 'Please specify a reason when marking lead as Lost.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
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
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '620px', borderRadius: '16px' }}
      >
        <div className="modal-header" style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}>
              {initialData ? <BookOpen size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {initialData ? 'Edit Student Enquiry' : 'Register New Student Lead'}
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
                {initialData ? 'Update student communication details and preferences' : 'Capture prospective student interest and assign ownership'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-ghost btn-sm" 
            aria-label="Close modal"
            style={{ borderRadius: '8px', padding: '0.4rem' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" style={{ padding: '1.75rem' }}>
            {hasSubmitted && Object.keys(errors).length > 0 && (
              <div className="auth-error-box" role="alert" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>Please fix the highlighted fields below before saving.</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Student Full Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  className={`auth-input-field ${errors.fullName ? 'error' : ''}`}
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ borderColor: errors.fullName ? '#ef4444' : undefined }}
                />
              </div>
              {errors.fullName && <div className="form-error">{errors.fullName}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Contact Phone</label>
                <div className="auth-input-wrapper">
                  <Phone size={18} className="auth-input-icon" />
                  <input
                    type="tel"
                    className={`auth-input-field ${errors.phone ? 'error' : ''}`}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ borderColor: errors.phone ? '#ef4444' : undefined }}
                  />
                </div>
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    type="email"
                    className={`auth-input-field ${errors.email ? 'error' : ''}`}
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ borderColor: errors.email ? '#ef4444' : undefined }}
                  />
                </div>
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Course Interest</label>
                <div className="auth-input-wrapper">
                  <BookOpen size={18} className="auth-input-icon" />
                  <select
                    className="form-select auth-input-field"
                    value={courseInterest}
                    onChange={(e) => setCourseInterest(e.target.value)}
                    style={{ paddingLeft: '2.65rem' }}
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Enquiry Channel / Source</label>
                <div className="auth-input-wrapper">
                  <Globe size={18} className="auth-input-icon" />
                  <select
                    className="form-select auth-input-field"
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    style={{ paddingLeft: '2.65rem' }}
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label required">Initial Status</label>
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
                <label className="form-label">Assign to Counsellor</label>
                <div className="auth-input-wrapper">
                  <UserCheck size={18} className="auth-input-icon" />
                  <select
                    className="form-select auth-input-field"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={{ paddingLeft: '2.65rem' }}
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Conversation Background & Notes</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Details from enquiry call, educational background, questions about curriculum..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
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
              className="btn btn-primary" 
              disabled={isSubmitting}
              style={{ borderRadius: '8px', minWidth: '130px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialData ? 'Update Lead' : 'Save Student Lead'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
