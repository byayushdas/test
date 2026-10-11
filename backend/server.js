import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dmpwhzruutpbtmxffwoc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.warn('⚠️ WARNING: SUPABASE_ANON_KEY is not set in backend/.env');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Middleware
app.use(cors({
  origin: '*', // Allow frontend dev server
  credentials: true
}));
app.use(express.json());

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running',
    supabaseUrl: SUPABASE_URL,
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// Auth: Sign Up
// -----------------------------------------------------------------------------
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        return res.status(429).json({
          error: 'Email rate limit exceeded (3-4/hr limit on Supabase default SMTP). Please turn off "Confirm email" in Supabase Dashboard > Authentication > Providers > Email to test without restrictions.'
        });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: data.session ? 'Registered and logged in successfully' : 'Confirmation email sent',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Auth: Log In
// -----------------------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Successfully logged in',
      user: data.user,
      session: data.session
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// Auth: Log Out
// -----------------------------------------------------------------------------
app.post('/api/auth/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  try {
    if (token) {
      await supabase.auth.admin?.signOut?.(token) || await supabase.auth.signOut();
    } else {
      await supabase.auth.signOut();
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Auth: Current User Profile (Me)
// -----------------------------------------------------------------------------
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: error ? error.message : 'Invalid token' });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend server listening on http://localhost:${PORT}`);
});
