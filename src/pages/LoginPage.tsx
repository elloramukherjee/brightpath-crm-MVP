import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  AlertCircle, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your work email and password.');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Please enter your full name for your staff profile.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res && res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await signIn(email.trim(), password);
        if (res && res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }
      }
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected authentication error occurred.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Pane: Bespoke Brand Showcase */}
      <section className="auth-showcase-pane" aria-label="BrightPath Academy Brand Overview">
        <div className="auth-brand-logo">
          <div className="auth-logo-badge">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="auth-brand-title">BrightPath CRM</div>
            <div style={{ fontSize: '0.725rem', color: '#60a5fa', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Academy Admissions Portal
            </div>
          </div>
        </div>

        <div className="auth-showcase-hero">
          <h1 className="auth-hero-headline">
            Empowering coaching institutes with <span>complete pipeline clarity</span>.
          </h1>
          <p className="auth-hero-subtext">
            Eliminate missed student enquiries, automate follow-up schedules, and accelerate enrollment conversion rates with end-to-end accountability.
          </p>

          {/* Interactive Floating Impact Card */}
          <div className="auth-metrics-card">
            <div className="auth-metrics-header">
              <span className="auth-metrics-dot" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Live Institute Performance</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <TrendingUp size={12} /> +24% YoY
              </span>
            </div>

            <div className="auth-metrics-grid">
              <div>
                <div className="auth-stat-value">94.2%</div>
                <div className="auth-stat-label">Follow-up SLA Met</div>
              </div>
              <div>
                <div className="auth-stat-value">1,280+</div>
                <div className="auth-stat-label">Students Enrolled</div>
              </div>
            </div>

            <div style={{ marginTop: '0.875rem', fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <span>"Zero lost enquiries since deploying BrightPath CRM."</span>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={16} color="#60a5fa" />
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Enterprise Row Level Security (RLS)</span>
          </div>
          <span>PostgreSQL boundary isolation enforcing staff role privileges.</span>
        </div>
      </section>

      {/* Right Pane: High-Polish Interactive Form */}
      <section className="auth-form-pane">
        <div className="auth-card-container">
          <div className="auth-header-group">
            <h2 className="auth-header-title">
              {isSignUp ? 'Create Staff Account' : 'Welcome Back'}
            </h2>
            <p className="auth-header-subtitle">
              {isSignUp 
                ? 'Join your academy team to start managing student admissions' 
                : 'Sign in to access your student leads, schedule, and pipeline'}
            </p>
          </div>

          {!isConfigured && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.825rem',
              color: '#1e40af'
            }}>
              <strong>Prototype Mode:</strong> Supabase credentials are not yet configured in <code>.env</code>.
            </div>
          )}

          {errorMsg && (
            <div className="auth-error-box" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sliding Segmented Tab Pill */}
          <div className="auth-tab-pill" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignUp}
              onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
              className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignUp}
              onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
              className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
            >
              Register Staff
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {isSignUp && (
              <div className="form-group">
                <label className="form-label required">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input 
                    type="text"
                    required
                    className="auth-input-field"
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Staff Email</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input 
                  type="email"
                  required
                  className="auth-input-field"
                  placeholder="counsellor@brightpath.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="form-label required" style={{ margin: 0 }}>Password</label>
                {!isSignUp && (
                  <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}>
                    Need help?
                  </span>
                )}
              </div>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="auth-input-field"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isSignUp ? 'Provisioning Account...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Staff Profile' : 'Sign In to Portal'}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
            New staff members default to Counsellor permissions. Role elevation is managed by Academy Administrators.
          </div>
        </div>
      </section>
    </div>
  );
};
