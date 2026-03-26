import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

const S = {
  input: { background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7, color: '#f0f0f0', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties,
  label: { color: '#7A7A7A', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 6, display: 'block' },
};

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#1a1a1a', border: '1px solid #222', borderRadius: 14, padding: '36px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#f0f0f0', fontSize: 22, fontWeight: 700, margin: 0 }}>Filament Inventory</h1>
          <p style={{ color: '#555', fontSize: 13, margin: '4px 0 0' }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label} htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={S.input} placeholder="you@example.com" autoCapitalize="none"
              onFocus={e => (e.target.style.borderColor = '#3367d6')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>
          <div>
            <label style={S.label} htmlFor="password">Password</label>
            <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={S.input} placeholder="••••••••"
              onFocus={e => (e.target.style.borderColor = '#3367d6')}
              onBlur={e => (e.target.style.borderColor = '#2a2a2a')} />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {error}
            </p>
          )}
          {message && (
            <p style={{ color: '#4ade80', fontSize: 13, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? '#1e3a8a' : '#3367d6', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', marginTop: 4 }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4a7aed'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#3367d6'; }}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
          <span style={{ color: '#555', fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#2a2a2a' }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#fff', color: '#3c4043', border: '1px solid #ddd', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null); }}
          style={{ color: '#3367d6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
