# Supabase React Fullstack Auth Application

A clean fullstack application with a **React (Vite) frontend** and an **Express.js backend** connected to **Supabase**.

---

## 📁 Project Structure

```text
├── backend/
│   ├── .env               # Server PORT, Supabase credentials, DB URL
│   ├── package.json       # Express, cors, dotenv, @supabase/supabase-js, pg
│   └── server.js          # REST API endpoints (/api/auth/signup, /api/auth/login, /api/auth/logout, /api/auth/me)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Simple Login/Signup view & Logged-in view with top-corner Logout button
│   │   ├── App.css        # Clean, modern styles
│   │   ├── supabase.js    # Supabase client setup
│   │   └── main.jsx       # React DOM entry
│   ├── vite.config.js     # Configured proxy to forward /api to backend (port 5000)
│   └── package.json
│
└── .env                   # Root environment credentials
```

---

## 🚀 Running the Application

### 1. Start the Backend Server (Port 5000)
```bash
cd backend
npm install
node server.js
```
The backend server runs on `http://localhost:5000`.

### 2. Start the Frontend React App (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
The React frontend runs on `http://localhost:5173`.

---

## 🔑 Supabase Credentials

- **Project URL**: `https://dmpwhzruutpbtmxffwoc.supabase.co`
- **Anon Key**: Pre-configured in `backend/.env` and `frontend/src/supabase.js`.
- **PostgreSQL Connection String**:
  ```text
  postgresql://postgres:H4f29QeqPl9H1FEo@db.dmpwhzruutpbtmxffwoc.supabase.co:5432/postgres
  ```

---

## ✨ Features

- **Authentication**:
  - Clean login and signup screens with Supabase authentication.
  - Dedicated **Logout** button in top-right corner.
- **Student Profile Form**:
  - Appears after logging in.
  - Fields: **Name**, **University**, **Class / Semester**, **Roll Number**, **Phone Number**, and **ID Card (PDF)**.
  - File upload with format & size validation (PDF only, up to 10MB).
  - **Submitted Status View**: Displays a clean confirmation card with "✓ Submitted" badge, entered information, and a **View / Download PDF** button.
  - **Edit Form**: Includes an **Edit** button that re-opens the pre-filled form to update any detail or replace the ID Card PDF.
  - Stored in Supabase `student_profiles` table and `id_cards` Storage Bucket.

---

## 🗄️ Supabase Database & Storage Setup

Run the following SQL in the **SQL Editor** of your [Supabase Dashboard](https://supabase.com/dashboard/project/dmpwhzruutpbtmxffwoc):

```sql
-- 1. Create or update the student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  class_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  id_card_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- If you already created the table previously, run this to add the ID card column:
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS id_card_url TEXT;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Table RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.student_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.student_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.student_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Create Storage Bucket for ID Cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('id_cards', 'id_cards', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage RLS Policies
CREATE POLICY "Allow authenticated users to upload ID cards"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'id_cards');

CREATE POLICY "Allow authenticated users to update ID cards"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'id_cards');

CREATE POLICY "Allow public read access to ID cards"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'id_cards');
```

---

## ⚠️ Note on "Email rate limit exceeded"

If you register new users and see `Email rate limit exceeded`:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/dmpwhzruutpbtmxffwoc).
2. Go to **Authentication** &rarr; **Providers** &rarr; **Email**.
3. Turn **OFF** the toggle for **"Confirm email"** and click **Save**.
4. Users can then register and sign in instantly without hitting the default 3-4 emails/hr limit.