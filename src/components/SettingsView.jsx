import React, { useState } from 'react';
import { ChevronLeft, Sliders, User, KeyRound, Loader2, CheckCircle2, LogOut, Check } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function SettingsView({ user, activeFont, onSelectFont, onBack, onSignOut }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'profile'
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccessMsg('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-wrapper fade-in" style={{ width: '100%' }}>
      <div className="editor-header">
        <button onClick={onBack} className="editor-back-btn" aria-label="Go back to timeline">
          <ChevronLeft className="w-5 h-5" />
          <span>Timeline</span>
        </button>

        {activeTab === 'profile' && (
          <button
            onClick={onSignOut}
            className="btn-icon"
            style={{ color: '#e74c3c', borderColor: 'var(--border-color)' }}
            title="Sign Out"
            aria-label="Sign out of account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Settings</h1>
      </div>

      <div className="settings-container">
        {/* Left Sidebar Navigation */}
        <aside className="settings-sidebar">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Sliders className="w-4 h-4" />
            <span>General</span>
          </button>

          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </aside>

        {/* Right Content Panel */}
        <main className="settings-content-panel">
          {activeTab === 'general' ? (
            <div className="fade-in">
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>Typography & Font Style</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Choose your preferred writing font. The selection will instantly reflect across your journal and preview live below.
                </p>
              </div>

              {/* Font Option 1: Roboto Mono */}
              <div
                className={`font-option-card ${activeFont === 'roboto-mono' ? 'selected' : ''}`}
                onClick={() => onSelectFont('roboto-mono')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectFont('roboto-mono'); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-roboto-mono)' }}>
                      Roboto Mono
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Monospaced (Default)
                    </span>
                  </div>
                  {activeFont === 'roboto-mono' && (
                    <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="font-preview-box" style={{ fontFamily: 'var(--font-roboto-mono)' }}>
                  The quick brown fox jumps over the lazy dog. 0123456789
                </div>
              </div>

              {/* Font Option 2: Galaxie Copernicus */}
              <div
                className={`font-option-card ${activeFont === 'galaxie-copernicus' ? 'selected' : ''}`}
                onClick={() => onSelectFont('galaxie-copernicus')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectFont('galaxie-copernicus'); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-galaxie-copernicus)' }}>
                      Galaxie Copernicus
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Serif
                    </span>
                  </div>
                  {activeFont === 'galaxie-copernicus' && (
                    <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="font-preview-box" style={{ fontFamily: 'var(--font-galaxie-copernicus)' }}>
                  The quick brown fox jumps over the lazy dog. 0123456789
                </div>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>Account Profile</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  View account credentials and update your security settings.
                </p>
              </div>

              <div style={{ marginBottom: '1.75rem', padding: '1rem', backgroundColor: 'var(--accent-light)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Signed in as
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Change Password</h3>

              {errorMsg && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', color: '#e74c3c', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(46, 204, 113, 0.1)', border: '1px solid rgba(46, 204, 113, 0.3)', color: '#2ecc71', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="search-input"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <KeyRound className="w-4 h-4" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="search-input"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                    <KeyRound className="w-4 h-4" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.85rem',
                    backgroundColor: 'var(--text-color)',
                    color: 'var(--bg-color)',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-app)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </form>

              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={onSignOut}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #e74c3c',
                    color: '#e74c3c',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-app)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
