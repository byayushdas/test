import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabase';

function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { text, type: 'error' | 'success' }

  // Student Form State
  const [formData, setFormData] = useState({
    name: '',
    university: '',
    class_name: '',
    roll_no: '',
    phone_number: '',
    id_card_url: ''
  });
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [savedProfile, setSavedProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Check saved session & listen to auth state changes
  useEffect(() => {
    // 1. Initial local storage check for fast render
    const savedUser = localStorage.getItem('auth_user');
    const savedSession = localStorage.getItem('auth_session');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }

    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession?.access_token && parsedSession?.refresh_token) {
          supabase.auth.setSession({
            access_token: parsedSession.access_token,
            refresh_token: parsedSession.refresh_token
          }).then(({ data }) => {
            if (data?.session) {
              setSession(data.session);
              setUser(data.session.user);
              fetchProfile(data.session.user, data.session.access_token);
            }
          }).catch(console.error);
        }
      } catch (e) {
        localStorage.removeItem('auth_session');
      }
    }

    // 2. Fetch current active session from Supabase client
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setSession(session);
        localStorage.setItem('auth_user', JSON.stringify(session.user));
        localStorage.setItem('auth_session', JSON.stringify(session));
        fetchProfile(session.user, session.access_token);
      }
    });

    // 3. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        localStorage.setItem('auth_user', JSON.stringify(currentSession.user));
        localStorage.setItem('auth_session', JSON.stringify(currentSession));
        fetchProfile(currentSession.user, currentSession.access_token);
      } else {
        setUser(null);
        setSession(null);
        setSavedProfile(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch student profile from database
  const fetchProfile = async (currentUser, token) => {
    if (!currentUser) return;
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      let profile = null;

      // Try backend server first if available
      try {
        const res = await fetch('/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          profile = data.profile;
        }
      } catch (backendErr) {
        console.warn('Backend not accessible, querying Supabase directly:', backendErr);
      }

      // If backend didn't return or was offline, query Supabase directly
      if (!profile) {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) {
          console.error('Supabase fetch error:', error);
        } else if (data) {
          profile = data;
        }
      }

      if (profile) {
        setSavedProfile(profile);
        setFormData({
          name: profile.name || '',
          university: profile.university || '',
          class_name: profile.class_name || '',
          roll_no: profile.roll_no || '',
          phone_number: profile.phone_number || '',
          id_card_url: profile.id_card_url || ''
        });
        setIsEditing(false);
      } else {
        setSavedProfile(null);
        setIsEditing(true); // Open form if no details exist yet
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Auth: Log In / Sign Up handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage({ text: 'Please fill in both email and password.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
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
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          }).catch(console.error);
          setUser(data.user);
          setSession(data.session);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          localStorage.setItem('auth_session', JSON.stringify(data.session));
          setMessage({ text: 'Account created! Successfully logged in.', type: 'success' });
          fetchProfile(data.user, data.session.access_token);
        } else {
          setMessage({
            text: 'Account created! Please check your email to confirm, then log in.',
            type: 'success'
          });
          setIsSignup(false);
        }
      } else {
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          }).catch(console.error);
          setSession(data.session);
          localStorage.setItem('auth_session', JSON.stringify(data.session));
        }
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        setMessage({ text: 'Successfully logged in!', type: 'success' });
        fetchProfile(data.user, data.session?.access_token);
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

  // Auth: Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setUser(null);
      setSession(null);
      setSavedProfile(null);
      setIsEditing(false);
      setSelectedPdf(null);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_session');
      setMessage(null);
      setProfileMessage(null);
      setIsSignup(false);
    }
  };

  // Handle Input Changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle PDF File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setProfileMessage({
        text: 'Invalid file format. Please upload a PDF file for your ID card.',
        type: 'error'
      });
      e.target.value = '';
      setSelectedPdf(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setProfileMessage({
        text: 'File size exceeds 10MB. Please upload a smaller PDF.',
        type: 'error'
      });
      e.target.value = '';
      setSelectedPdf(null);
      return;
    }

    setSelectedPdf(file);
    setProfileMessage(null);
  };

  // Student Profile: Form Submit (Save / Update to Supabase)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);

    // Validate required fields
    const { name, university, class_name, roll_no, phone_number, id_card_url } = formData;
    if (
      !name.trim() ||
      !university.trim() ||
      !class_name.trim() ||
      !roll_no.trim() ||
      !phone_number.trim()
    ) {
      setProfileMessage({
        text: 'All fields are required. Please fill in Name, University, Class, Roll Number, and Phone Number.',
        type: 'error'
      });
      return;
    }

    // Require ID Card PDF on first submission
    if (!selectedPdf && !id_card_url) {
      setProfileMessage({
        text: 'Please upload a PDF of your ID card to continue.',
        type: 'error'
      });
      return;
    }

    setProfileSubmitting(true);

    try {
      let finalIdCardUrl = id_card_url;

      // 1. If a new PDF file was chosen, upload to Supabase Storage 'id_cards' bucket
      if (selectedPdf) {
        // Ensure browser supabase client has the active session before upload
        if (session?.access_token && session?.refresh_token) {
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }).catch(() => {});
        }

        const fileExt = selectedPdf.name.split('.').pop() || 'pdf';
        const fileName = `${user.id}/${Date.now()}_id_card.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('id_cards')
          .upload(fileName, selectedPdf, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          if (uploadError.message?.toLowerCase().includes('row-level security') || uploadError.message?.toLowerCase().includes('violates')) {
            throw new Error(
              `Supabase Storage RLS policy violation: Please run the storage policies in Supabase SQL Editor to allow uploads to the 'id_cards' bucket.`
            );
          }
          throw new Error(
            `Supabase Storage upload error: ${uploadError.message}. Make sure the 'id_cards' bucket exists in Supabase Storage.`
          );
        }

        const { data: urlData } = supabase.storage
          .from('id_cards')
          .getPublicUrl(fileName);

        finalIdCardUrl = urlData.publicUrl;
      }

      const submissionPayload = {
        name: name.trim(),
        university: university.trim(),
        class_name: class_name.trim(),
        roll_no: roll_no.trim(),
        phone_number: phone_number.trim(),
        id_card_url: finalIdCardUrl
      };

      let saved = null;
      const token = session?.access_token;

      // 2. Try backend API endpoint first
      if (token) {
        try {
          const res = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(submissionPayload)
          });
          if (res.ok) {
            const result = await res.json();
            saved = result.profile;
          }
        } catch (apiErr) {
          console.warn('Backend /api/profile failed, trying direct Supabase client:', apiErr);
        }
      }

      // 3. Fallback to direct Supabase client
      if (!saved) {
        const directPayload = {
          user_id: user.id,
          email: user.email,
          ...submissionPayload,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('student_profiles')
          .upsert(directPayload, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) {
          throw error;
        }
        saved = data;
      }

      setSavedProfile(saved);
      setFormData((prev) => ({
        ...prev,
        id_card_url: finalIdCardUrl
      }));
      setSelectedPdf(null);
      setIsEditing(false);
      setProfileMessage({
        text: 'Form Submitted! Your details and ID Card PDF have been successfully saved to Supabase.',
        type: 'success'
      });
    } catch (err) {
      console.error('Error saving profile to Supabase:', err);
      setProfileMessage({
        text: `Error saving: ${err.message || 'Please check your Supabase configuration.'}`,
        type: 'error'
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. LOGGED-IN VIEW: Student Registration Form & Submitted Card
  // ---------------------------------------------------------------------------
  if (user) {
    return (
      <div className="app-container">
        {/* Top Navbar */}
        <header className="top-bar">
          <div className="top-bar-brand">
            <span className="brand-dot"></span> Student Portal
          </div>
          <div className="top-bar-right">
            <span className="user-email-pill" title={user.email}>
              👤 {user.email}
            </span>
            <button className="top-corner-logout-btn" onClick={handleLogout} title="Log out">
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="portal-container">
            {profileMessage && (
              <div className={`alert-box alert-${profileMessage.type}`}>
                {profileMessage.type === 'success' ? '✓ ' : '⚠️ '}
                {profileMessage.text}
              </div>
            )}

            {profileLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your profile from Supabase...</p>
              </div>
            ) : savedProfile && !isEditing ? (
              /* ---------------- SUBMITTED VIEW ---------------- */
              <div className="submitted-card">
                <div className="status-badge-wrap">
                  <span className="submitted-badge">
                    <span className="badge-icon">✓</span> Submitted
                  </span>
                </div>

                <h2 className="card-heading">Student Information</h2>
                <p className="card-subheading">
                  Your details and ID Card are registered and saved in Supabase.
                </p>

                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Full Name</span>
                    <span className="detail-value">{savedProfile.name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">University</span>
                    <span className="detail-value">{savedProfile.university}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Class</span>
                    <span className="detail-value">{savedProfile.class_name}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Roll Number</span>
                    <span className="detail-value">{savedProfile.roll_no}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-value">{savedProfile.phone_number}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{savedProfile.email || user.email}</span>
                  </div>

                  {/* ID Card PDF Detail */}
                  <div className="detail-item full-width-detail">
                    <span className="detail-label">ID Card (PDF)</span>
                    {savedProfile.id_card_url ? (
                      <div className="pdf-display-box">
                        <div className="pdf-meta">
                          <span className="pdf-icon">📄</span>
                          <span className="pdf-title">Uploaded Student ID Card</span>
                        </div>
                        <a
                          href={savedProfile.id_card_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pdf-link-btn"
                        >
                          View / Download PDF ↗
                        </a>
                      </div>
                    ) : (
                      <span className="detail-value text-muted">No ID card uploaded</span>
                    )}
                  </div>
                </div>

                {savedProfile.updated_at && (
                  <div className="timestamp-note">
                    Last updated: {new Date(savedProfile.updated_at).toLocaleString()}
                  </div>
                )}

                <div className="card-actions">
                  <button
                    id="edit-profile-btn"
                    className="edit-btn"
                    onClick={() => {
                      setProfileMessage(null);
                      setSelectedPdf(null);
                      setIsEditing(true);
                    }}
                  >
                    ✏️ Edit Form
                  </button>
                </div>
              </div>
            ) : (
              /* ---------------- FORM FILL UP / EDIT VIEW ---------------- */
              <div className="form-card">
                <div className="form-card-header">
                  <div className="form-tag">
                    {savedProfile ? 'Update Mode' : 'New Submission'}
                  </div>
                  <h2 className="card-heading">
                    {savedProfile ? 'Edit Student Details' : 'Student Information Form'}
                  </h2>
                  <p className="card-subheading">
                    {savedProfile
                      ? 'Update your details or ID Card PDF below and click Submit to save to Supabase.'
                      : 'Please fill in all the required details and upload your ID Card PDF to submit.'}
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="student-form">
                  <div className="form-grid">
                    {/* Name */}
                    <div className="form-group full-width">
                      <label htmlFor="name">
                        Full Name <span className="req">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* University */}
                    <div className="form-group full-width">
                      <label htmlFor="university">
                        University <span className="req">*</span>
                      </label>
                      <input
                        id="university"
                        name="university"
                        type="text"
                        placeholder="e.g. Stanford University"
                        value={formData.university}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Class */}
                    <div className="form-group">
                      <label htmlFor="class_name">
                        Class / Semester <span className="req">*</span>
                      </label>
                      <input
                        id="class_name"
                        name="class_name"
                        type="text"
                        placeholder="e.g. B.Tech CS 3rd Year"
                        value={formData.class_name}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Roll Number */}
                    <div className="form-group">
                      <label htmlFor="roll_no">
                        Roll Number <span className="req">*</span>
                      </label>
                      <input
                        id="roll_no"
                        name="roll_no"
                        type="text"
                        placeholder="e.g. 2024-CS-042"
                        value={formData.roll_no}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="form-group full-width">
                      <label htmlFor="phone_number">
                        Phone Number <span className="req">*</span>
                      </label>
                      <input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        placeholder="e.g. +1 555-019-2834"
                        value={formData.phone_number}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* ID Card PDF Upload */}
                    <div className="form-group full-width">
                      <label htmlFor="id_card_pdf">
                        ID Card (PDF) <span className="req">*</span>
                      </label>
                      <div className="file-upload-wrapper">
                        <input
                          id="id_card_pdf"
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleFileChange}
                          className="file-hidden-input"
                        />
                        <label htmlFor="id_card_pdf" className="file-dropzone">
                          <span className="dropzone-icon">📄</span>
                          <span className="dropzone-title">
                            {selectedPdf ? selectedPdf.name : 'Click to select ID Card (PDF)'}
                          </span>
                          <span className="dropzone-sub">
                            {selectedPdf
                              ? `Selected size: ${(selectedPdf.size / 1024).toFixed(1)} KB`
                              : 'PDF only (Max file size: 10MB)'}
                          </span>
                        </label>

                        {formData.id_card_url && (
                          <div className="existing-pdf-row">
                            <span className="existing-label">Current ID Card:</span>
                            <a
                              href={formData.id_card_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="existing-link"
                            >
                              View Current Uploaded PDF ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-buttons-row">
                    <button
                      id="submit-profile-btn"
                      type="submit"
                      className="submit-btn"
                      disabled={profileSubmitting}
                    >
                      {profileSubmitting ? 'Uploading & Saving to Supabase...' : 'Submit'}
                    </button>

                    {savedProfile && (
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => {
                          setProfileMessage(null);
                          setSelectedPdf(null);
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. AUTH VIEW: LOGIN / SIGNUP
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

          <form onSubmit={handleAuthSubmit} className="auth-form">
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
