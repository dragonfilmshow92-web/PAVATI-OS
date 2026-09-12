import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Moon,
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const { 
    currentUser, 
    loginWithGoogle, 
    loginWithEmail, 
    registerWithEmail, 
    resetPassword, 
    loginAsGuest, 
    showToast, 
    setCurrentPage, 
    theme, 
    toggleTheme,
    settings 
  } = useApp();

  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // Password Reset state
  const [showResetBox, setShowResetBox] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const storeName = settings?.store_name || 'PAVATI OS';

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthSuccess('');
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.success) {
        setAuthError(res.error || 'Google sign-in could not be completed.');
      }
    } catch (err) {
      setAuthError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!email || !password) {
      setAuthError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signup') {
        const res = await registerWithEmail(email, password, displayName || 'Store Manager');
        if (!res.success) {
          setAuthError(res.error || 'Account creation failed. Please check your credentials.');
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          setAuthError(res.error || 'Sign-in failed. Please verify your email and password.');
        }
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setAuthError('Please enter your email to receive the password reset link.');
      return;
    }
    setResetLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await resetPassword(resetEmail);
      if (res.success) {
        setAuthSuccess(`Password reset email sent to ${resetEmail}. Check your inbox.`);
        setShowResetBox(false);
      } else {
        setAuthError(res.error || 'Failed to send password reset email.');
      }
    } catch (err) {
      setAuthError(err.message || 'Error requesting password reset.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Background Ambient Glow Orbs */}
      <div className="login-ambient-orb login-orb-1"></div>
      <div className="login-ambient-orb login-orb-2"></div>

      {/* Top Floating Navigation Header */}
      <nav className="login-top-nav">
        <button 
          type="button" 
          className="login-brand-link" 
          onClick={() => setCurrentPage('landing')}
          title="Return to PAVATI OS Home"
        >
          <div className="login-brand-icon">PV</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="login-brand-title">{storeName}</span>
            <span className="login-brand-badge">Cloud POS</span>
          </div>
        </button>

        <div className="login-top-actions">
          <button 
            type="button" 
            className="login-nav-btn" 
            onClick={() => setCurrentPage('landing')}
          >
            <ArrowLeft size={14} />
            <span>Overview</span>
          </button>

          <button 
            type="button" 
            className="login-nav-btn" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#4f46e5" />}
          </button>
        </div>
      </nav>

      {/* Main Authentication Card */}
      <div className="login-card-container">
        <div className="login-card">
          {/* Card Header */}
          <div className="login-header-block">
            <h2>{authMode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
            <p>
              {authMode === 'signin' 
                ? 'Sign in to access your retail terminal and live stores' 
                : 'Register a new enterprise manager station'}
            </p>
          </div>

          {/* If already logged in, offer fast shortcut */}
          {currentUser && (
            <div style={{ 
              marginBottom: '20px', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              background: 'rgba(79, 70, 229, 0.12)', 
              border: '1px solid rgba(79, 70, 229, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Active as {currentUser.displayName || currentUser.email}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {currentUser.isGuest ? 'Terminal Demo Mode' : 'Cloud Authenticated'}
                </div>
              </div>
              <button 
                type="button" 
                className="btn-submit-auth" 
                style={{ padding: '8px 14px', fontSize: '12px', width: 'auto', marginTop: 0 }}
                onClick={() => setCurrentPage('pos')}
              >
                Open POS Counter
              </button>
            </div>
          )}

          {/* Google One-Click Sign-in Button */}
          <button 
            type="button" 
            className="btn-google-auth" 
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <div className="auth-spinner" style={{ borderTopColor: 'var(--accent-indigo)' }}></div>
            ) : (
              <svg className="google-icon-svg" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.25 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.09z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Connecting Google Account...' : 'Continue with Google'}</span>
          </button>

          {/* OR Divider */}
          <div className="login-separator">
            <span>or with email</span>
          </div>

          {/* Mode Tabs: Sign In / Create Account */}
          <div className="login-tabs-nav">
            <button 
              type="button" 
              className={`login-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess(''); }}
            >
              Sign In
            </button>
            <button 
              type="button" 
              className={`login-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="login-error-banner">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          {/* Success Banner */}
          {authSuccess && (
            <div className="login-success-banner">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Main Auth Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {authMode === 'signup' && (
              <div className="login-field-group">
                <label>Full Name</label>
                <div className="login-input-wrap">
                  <User size={16} className="field-icon" />
                  <input 
                    type="text"
                    className="login-input"
                    placeholder="e.g. Anand Sharma"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="login-field-group">
              <label>Enterprise Email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="field-icon" />
                <input 
                  type="email"
                  className="login-input"
                  placeholder="cashier@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field-group">
              <label>
                <span>Password</span>
                {authMode === 'signin' && (
                  <button 
                    type="button" 
                    className="login-forgot-link"
                    onClick={() => {
                      setShowResetBox(prev => !prev);
                      setResetEmail(email);
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </label>
              <div className="login-input-wrap">
                <Lock size={16} className="field-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button 
                  type="button" 
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(prev => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Reset Password Drawer */}
            {showResetBox && (
              <div className="reset-pwd-box">
                <h4>Reset Your Password</h4>
                <p>Enter your account email below to receive a secure recovery link.</p>
                <div className="login-input-wrap">
                  <Mail size={16} className="field-icon" />
                  <input 
                    type="email" 
                    className="login-input" 
                    placeholder="name@company.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <div className="reset-actions">
                  <button 
                    type="button" 
                    className="btn-reset-cancel" 
                    onClick={() => setShowResetBox(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn-reset-send" 
                    onClick={handlePasswordReset}
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-submit-auth" 
              disabled={loading || googleLoading}
            >
              {loading && <div className="auth-spinner"></div>}
              <span>
                {loading 
                  ? (authMode === 'signin' ? 'Authenticating...' : 'Creating Station...') 
                  : (authMode === 'signin' ? 'Sign In to Terminal' : 'Create Station Account')}
              </span>
            </button>
          </form>

          {/* Zero Lockout Guest Cashier Mode */}
          <div className="login-guest-section">
            <button 
              type="button" 
              className="btn-guest-login"
              onClick={loginAsGuest}
            >
              <Zap size={16} color="var(--accent-emerald, #10b981)" />
              <span>Continue as Terminal Cashier (Demo Mode)</span>
            </button>
            <p className="guest-desc-text">
              Zero login friction. Run instant retail billing, barcode scanning, and invoice printing without cloud signup.
            </p>
          </div>
        </div>

        {/* Security / Compliance Badge */}
        <div className="login-security-footer">
          <ShieldCheck size={14} className="security-lock-icon" />
          <span>Encrypted 256-bit TLS • Firebase Auth • GST Ready</span>
        </div>
      </div>
    </div>
  );
}
