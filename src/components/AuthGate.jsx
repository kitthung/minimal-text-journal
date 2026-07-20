import React, { useState } from 'react';
import { BookOpen, KeyRound, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export default function AuthGate() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        
        if (data.session) {
          setSuccessMsg('Account created successfully!');
        } else {
          setSuccessMsg('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex flex-col justify-center items-center py-12 fade-in" style={{ minHeight: '80vh' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '2.5rem 2rem',
          boxShadow: '0 8px 24px var(--shadow-color)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BookOpen className="w-6 h-6" />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.05em' }}>log</span>
            <span className="brand-cursor"></span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {isSignUp ? 'Create your minimalist journal account' : 'Sign in to access your synchronized journal'}
          </p>
        </div>

        {errorMsg && (
          <div 
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              border: '1px solid rgba(231, 76, 60, 0.3)',
              color: '#e74c3c',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              wordBreak: 'break-word'
            }}
          >
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div 
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              border: '1px solid rgba(46, 204, 113, 0.3)',
              color: '#2ecc71',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="search-input"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail 
                className="w-4 h-4" 
                style={{ 
                  position: 'absolute', 
                  left: '0.85rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="search-input"
                style={{ paddingLeft: '2.5rem' }}
              />
              <KeyRound 
                className="w-4 h-4" 
                style={{ 
                  position: 'absolute', 
                  left: '0.85rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-muted)' 
                }} 
              />
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
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all var(--transition-speed) var(--transition-smooth)'
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"} </span>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-color)',
              fontWeight: 700,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
