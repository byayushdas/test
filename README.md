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

## ✨ Frontend Features

- **Simple Login / Sign Up Page**: Clean, minimal form with email & password and a toggle link between Login and Sign Up.
- **Logged-in View**: 
  - Displays a clean message: **"Successfully Logged In!"** along with the user's email.
  - In the **top-right corner**, a dedicated **Logout** button.
  - Clicking **Logout** immediately logs the user out and returns to the login page.

---

## ⚠️ Note on "Email rate limit exceeded"

If you register new users and see `Email rate limit exceeded`:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/dmpwhzruutpbtmxffwoc).
2. Go to **Authentication** &rarr; **Providers** &rarr; **Email**.
3. Turn **OFF** the toggle for **"Confirm email"** and click **Save**.
4. Users can then register and sign in instantly without hitting the default 3-4 emails/hr limit.