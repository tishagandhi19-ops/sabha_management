import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { SpinnerLoader } from './Loaders';

export default function Login({ onLogin, authLoading, authError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '40px 28px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <span className="brand-mark" style={{ width: 60, height: 60, borderRadius: 18, marginBottom: 20 }}>
          <Users size={30} />
        </span>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.025em' }}>સભા વ્યવસ્થાપન</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.6 }}>
          રવિસભા હાજરી સોફ્ટવેર
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'left' }}>
          <div>
            <label htmlFor="login-username" className="form-label">વપરાશકર્તા નામ</label>
            <input
              id="login-username"
              type="text"
              className="glass-input"
              placeholder="admin"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="form-label">પાસવર્ડ</label>
            <input
              id="login-password"
              type="password"
              className="glass-input"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {authError && (
            <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center', margin: '4px 0' }}>
              {authError}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={authLoading} style={{ marginTop: 8 }}>
            {authLoading ? <SpinnerLoader size={20} /> : 'લોગિન કરો'}
          </button>
        </form>
      </div>
    </div>
  );
}
