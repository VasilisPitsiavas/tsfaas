# Supabase Authentication Setup - Complete Guide

## ✅ What Was Implemented

### 1. Environment Configuration
- **Frontend** (`frontend/.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (safe for frontend)

- **Backend** (`backend/.env`):
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (BACKEND ONLY - never expose!)
  - `DATABASE_URL` - PostgreSQL connection string (optional)

### 2. Supabase Client Libraries
- **Frontend**: Already had `@supabase/ssr` and `@supabase/supabase-js`
- **Backend**: Added `supabase==2.3.4` to `requirements.txt`

### 3. Supabase Client Utilities Created
- `frontend/lib/supabase/client.ts` - Browser client for client components
- `frontend/lib/supabase/server.ts` - Server client for Server Components
- `frontend/lib/supabase/middleware.ts` - Middleware client for route protection

### 4. Authentication UI Components
- `frontend/components/auth/LoginForm.tsx` - Login/Signup form component
- `frontend/components/auth/AuthButton.tsx` - Auth button for navigation bar
- `frontend/app/auth/callback/route.ts` - Email confirmation callback handler

### 5. Route Protection
- `frontend/middleware.ts` - Protects routes: `/dashboard`, `/upload`, `/configure`, `/results`
- Automatically redirects unauthenticated users to home/login page

### 6. Backend Authentication
- `backend/app/utils/auth.py` - JWT verification utilities
- All API endpoints now require authentication:
  - `/api/upload` - Stores `user_id` with each job
  - `/api/jobs` - Returns only user's own jobs
  - `/api/jobs/{job_id}` - Verifies job ownership
  - `/api/forecast` - Verifies ownership before creating forecast
  - `/api/forecast/{forecast_id}` - Verifies ownership before returning results

### 7. Frontend API Client Updates
- `frontend/lib/api.ts` - Automatically includes auth tokens in all API requests

### 8. UI Updates
- Updated `frontend/intfrontend/Layout.tsx` - Added AuthButton to navigation
- Updated `frontend/app/home/page.tsx` - Shows login form when not authenticated
- Updated `frontend/app/layout.tsx` - Added Toaster component for notifications

## 🚀 How to Run

### Option 1: Local Development (Recommended for testing auth)

#### Frontend:
```bash
cd frontend
npm install  # Already done
npm run dev
# Runs on http://localhost:3000
```

#### Backend:
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
pip install -r requirements.txt  # Already done
uvicorn main:app --reload
# Runs on http://localhost:8000
```

**Note**: For full functionality, you'll also need:
- Redis (for job queue) - Install locally or use Docker just for Redis
- PostgreSQL (optional) - Only if using database features
- MinIO (optional) - Only if using S3 storage

### Option 2: Docker Compose (Full Stack)

```bash
# From project root
docker-compose up --build
```

This starts:
- Frontend (http://localhost:3000)
- Backend (http://localhost:8000)
- PostgreSQL
- Redis
- MinIO
- Worker

## 🔐 Authentication Flow

1. **Sign Up**: User visits home page → sees login form → signs up → receives email confirmation
2. **Sign In**: User signs in → redirected to dashboard
3. **Protected Routes**: Middleware checks auth → redirects to login if not authenticated
4. **API Calls**: Frontend automatically includes JWT token in Authorization header
5. **Backend Verification**: Backend verifies token → extracts user_id → filters data by user

## 📋 Supabase Tables Required

Make sure you have these tables in Supabase:

1. **profiles** table (for user profiles)
2. **forecast_jobs** table (for storing job metadata - optional, currently using file system)

## 🛠️ Troubleshooting

### IDE Import Errors (FastAPI)
- VS Code settings configured at `.vscode/settings.json`
- Make sure Python interpreter is set to `backend/venv/bin/python`
- Restart VS Code if needed

### TypeScript Errors
- Run `npm install` in frontend directory
- Run `npm run type-check` to verify

### Authentication Not Working
- Check that `.env.local` and `.env` files have correct Supabase credentials
- Verify Supabase project is active
- Check browser console for errors
- Check backend logs for authentication errors

## 📝 Files Changed/Created

### Created:
- `frontend/lib/supabase/client.ts`
- `frontend/lib/supabase/server.ts`
- `frontend/lib/supabase/middleware.ts`
- `frontend/middleware.ts`
- `frontend/components/auth/LoginForm.tsx`
- `frontend/components/auth/AuthButton.tsx`
- `frontend/app/auth/callback/route.ts`
- `backend/app/utils/auth.py`
- `.vscode/settings.json`
- `AUTHENTICATION_SETUP.md` (this file)

### Modified:
- `frontend/.env.local` - Added Supabase credentials
- `backend/.env` - Added Supabase credentials
- `frontend/lib/api.ts` - Added auth token interceptor
- `frontend/app/layout.tsx` - Added Toaster component
- `frontend/app/home/page.tsx` - Added login form display
- `frontend/intfrontend/Layout.tsx` - Added AuthButton
- `backend/app/api/upload.py` - Added auth requirement and user_id storage
- `backend/app/api/jobs.py` - Added auth requirement and user filtering
- `backend/app/api/forecast.py` - Added auth requirement and ownership verification
- `backend/app/core/config.py` - Added Supabase settings
- `backend/requirements.txt` - Added supabase package
- `.gitignore` - Updated to ignore .env files

## ✨ Next Steps

1. Test the authentication flow:
   - Sign up a new user
   - Verify email (if email confirmation enabled)
   - Sign in
   - Upload a CSV file
   - Verify jobs are user-scoped

2. Optional enhancements:
   - Add profile page
   - Add password reset
   - Add social auth (Google, GitHub, etc.)
   - Migrate job storage to Supabase database instead of file system
