import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabase';

function App() {
  const [user, setUser] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { text, type: 'error' | 'success' }

  // Check saved session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }

    // Also check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('auth_user', JSON.stringify(session.user));
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ text: 'Please fill in both email and password.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // First try sending request to backend server /api/auth
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      let res;
      let data;

      try {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        data = await res.json();
      } catch (networkErr) {
        // Fallback to direct client-side Supabase if backend is not started
        console.warn('Backend server not responding, falling back to direct Supabase client');
        if (isSignup) {
          const sbRes = await supabase.auth.signUp({ email, password });
          if (sbRes.error) throw sbRes.error;
          data = {
            message: sbRes.data.session ? 'Registered and logged in' : 'Confirmation email sent',
            user: sbRes.data.user,
            session: sbRes.data.session
          };
          res = { ok: true };
        } else {
          const sbRes = await supabase.auth.signInWithPassword({ email, password });
          if (sbRes.error) throw sbRes.error;
          data = {
            message: 'Successfully logged in',
            user: sbRes.data.user,
            session: sbRes.data.session
          };
          res = { ok: true };
        }
      }

      if (res && !res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isSignup) {
        if (data.session) {
          // If auto-confirm is enabled or session exists
          setUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          setMessage({ text: 'Account created! Successfully logged in.', type: 'success' });
        } else {
          setMessage({
            text: 'Account created! Please check your email to confirm, then log in.',
            type: 'success'
          });
          setIsSignup(false); // Switch to login
        }
      } else {
        // Login success
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setMessage({ text: 'Successfully logged in!', type: 'success' });
      }

      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Auth error:', err);
      let errMsg = err.message || 'An error occurred';
      if (errMsg.toLowerCase().includes('rate limit')) {
        errMsg = 'Rate limit exceeded: Turn OFF "Confirm email" in Supabase Dashboard > Authentication > Providers > Email to test without email limits.';
      }
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setUser(null);
      localStorage.removeItem('auth_user');
      setMessage(null);
      setIsSignup(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. LOGGED-IN VIEW
  // ---------------------------------------------------------------------------
  if (user) {
    return (
      <div className="app-container">
        {/* Top corner bar with Logout button */}
        <header className="top-bar">
          <div className="top-bar-brand">Dashboard</div>
          <button className="top-corner-logout-btn" onClick={handleLogout} title="Log out">
            Logout
          </button>
        </header>

        {/* Center message */}
        <main className="main-content">
          <div className="success-card">
            <div className="success-icon-wrap">✓</div>
            <h1 className="success-title">Successfully Logged In!</h1>
            <p className="user-badge">
              Logged in as: <strong>{user.email}</strong>
            </p>
            <p className="success-desc">
              You are authenticated. Use the <strong>Logout</strong> button in the top corner to return to the login page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. SIMPLE LOGIN / SIGNUP VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="app-container">
      <main className="main-content">
        <div className="auth-box">
          <div className="auth-header">
            <h1 className="auth-title">{isSignup ? 'Create Account' : 'Login'}</h1>
            <p className="auth-subtitle">
              {isSignup ? 'Enter details to register' : 'Enter your credentials to continue'}
            </p>
          </div>

          {message && (
            <div className={`alert-box alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className="toggle-mode">
            {isSignup ? (
              <>
                Already have an account?
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => {
                    setIsSignup(false);
                    setMessage(null);
                  }}
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Don't have an account?
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => {
                    setIsSignup(true);
                    setMessage(null);
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
