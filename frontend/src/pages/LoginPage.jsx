import { useState } from 'react';
import { login, setToken } from '../api';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('rajesh@bloodbank.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await login(email, password);
      const t = res.token || res.access_token || res.accessToken || '';
      if (t) setToken(t);
      const user = res.user || res.staff || res.data || { email, role: 'Admin' };
      localStorage.setItem('bb_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 60% 0%, #ffe0e0 0%, #fff0f0 40%, #fff8f8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: -100, right: -100, width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,20,60,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: -80, left: -80, width: 300, height: 300,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="anim-fadeup" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc143c, #8b0000)',
            boxShadow: '0 8px 32px rgba(220,20,60,0.35)',
            marginBottom: 16,
          }}>
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
              <path d="M14 1C14 1 1 13 1 21C1 28.2 6.8 34 14 34C21.2 34 27 28.2 27 21C27 13 14 1 14 1Z"
                fill="white" fillOpacity="0.95"/>
              <ellipse cx="10" cy="16" rx="3" ry="4.5" fill="rgba(220,20,60,0.3)" transform="rotate(-15 10 16)"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 700, color: '#1a0505', marginBottom: 4,
          }}>
            Blood<span style={{ color: '#dc143c' }}>Bank</span>
          </h1>
          <p style={{ color: '#7a4040', fontSize: 13 }}>Management System</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          boxShadow: '0 8px 48px rgba(180,0,30,0.12)',
          border: '1px solid #f0cccc', padding: '40px 36px',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a0505', marginBottom: 4 }}>Welcome back</h2>
          <p style={{ color: '#7a4040', fontSize: 13, marginBottom: 28 }}>Sign in to your staff account</p>

          {error && (
            <div style={{
              background: '#fff0f0', border: '1px solid #f0cccc', borderRadius: 8,
              padding: '10px 14px', marginBottom: 18,
              color: '#c0152a', fontSize: 13, fontWeight: 500,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a1a1a', marginBottom: 6 }}>
                Email address
              </label>
              <input
                className="form-input"
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@bloodbank.com"
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a1a1a', marginBottom: 6 }}>
                Password
              </label>
              <input
                className="form-input"
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: 15, borderRadius: 10 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: 24, padding: '14px 16px', background: '#fff8f8',
            borderRadius: 10, border: '1px solid #f5e0e0',
          }}>
            <p style={{ fontSize: 11, color: '#7a4040', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo credentials
            </p>
            <p style={{ fontSize: 12, color: '#4a1a1a' }}>rajesh@bloodbank.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
