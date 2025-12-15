# Quick Start Guide - Authentication Setup

## ✅ What's Been Done

1. **Supabase Integration**
   - Frontend: Supabase client utilities for browser, server, and middleware
   - Backend: JWT verification and user authentication
   - Environment files configured with your Supabase credentials

2. **Authentication UI**
   - Login/Signup form component
   - Auth button in navigation
   - Email confirmation callback handler

3. **Route Protection**
   - Middleware protects: `/dashboard`, `/upload`, `/configure`, `/results`
   - Unauthenticated users redirected to home/login

4. **User-Scoped Data**
   - All jobs are now scoped to the authenticated user
   - Backend verifies ownership before allowing access

## 🚀 Running the Application

### Option 1: Docker (Recommended - Full Stack) 🐳

**Best for:** Production-like environment, full stack testing, all services included

1. **Create `.env` file** (if not exists):
   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

2. **Start everything:**
   ```bash
   docker-compose up --build
   ```

   This starts:
   - ✅ Frontend: http://localhost:3000
   - ✅ Backend: http://localhost:8000
   - ✅ PostgreSQL (database)
   - ✅ Redis (job queue)
   - ✅ MinIO (S3 storage)
   - ✅ Worker (background jobs)

3. **Stop:**
   ```bash
   docker-compose down
   ```

**Advantages:**
- All services included (no manual setup)
- Production-like environment
- Isolated dependencies
- Easy to reset/clean

### Option 2: Local Development (For Quick Testing)

**Best for:** Quick iteration, debugging, development

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

**Note:** For full functionality, you'll also need:
- Redis (for job queue): `brew install redis && redis-server` (or use Docker just for Redis)
- PostgreSQL (optional): Only if using database features
- MinIO (optional): Only if using S3 storage

**Or use the quick start script:**
```bash
./start-dev.sh
```

## 🔐 Testing Authentication

1. **Start the application** (frontend + backend)

2. **Visit** http://localhost:3000

3. **Sign Up:**
   - Click "Sign Up" on the login form
   - Enter email and password (min 6 characters)
   - Check your email for confirmation link
   - Click the link to confirm your account

4. **Sign In:**
   - Enter your email and password
   - You'll be redirected to `/dashboard`

5. **Test Protected Routes:**
   - Try accessing `/dashboard`, `/upload`, `/configure`, `/results`
   - Without auth: redirected to home/login
   - With auth: access granted

## 📝 Environment Variables

### Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://jtarenapymmkqmmrjoih.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (`backend/.env`):
```
SUPABASE_URL=https://jtarenapymmkqmmrjoih.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...
```

## 🐛 Fixing IDE Errors

If you see "Import 'fastapi' could not be resolved":

1. **VS Code/Cursor:**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Python: Select Interpreter"
   - Choose: `./backend/venv/bin/python`

2. **Reload IDE:**
   - Restart your IDE/editor
   - The `.vscode/settings.json` file should auto-detect the venv

## 📋 Next Steps

1. **Test the full flow:**
   - Sign up → Sign in → Upload CSV → Configure → View Results

2. **Verify user scoping:**
   - Create two accounts
   - Upload files with each
   - Verify each user only sees their own jobs

3. **Database Setup (Optional):**
   - If you want to use Supabase PostgreSQL, update `DATABASE_URL` in `backend/.env`
   - The connection string format: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

## 🔒 Security Notes

- ✅ Service role key is **only** in backend (never exposed to frontend)
- ✅ JWT tokens verified on every API request
- ✅ User-scoped data (users can't access each other's jobs)
- ✅ Protected routes require authentication
- ✅ Job ownership verified before access

## 📚 Files Created/Modified

### New Files:
- `frontend/lib/supabase/client.ts` - Browser client
- `frontend/lib/supabase/server.ts` - Server client
- `frontend/lib/supabase/middleware.ts` - Middleware client
- `frontend/components/auth/LoginForm.tsx` - Login/Signup UI
- `frontend/components/auth/AuthButton.tsx` - Auth button
- `frontend/app/auth/callback/route.ts` - Email confirmation
- `frontend/middleware.ts` - Route protection
- `backend/app/utils/auth.py` - JWT verification

### Modified Files:
- `frontend/lib/api.ts` - Added auth token interceptor
- `frontend/app/layout.tsx` - Added Toaster component
- `frontend/app/home/page.tsx` - Shows login when not authenticated
- `frontend/intfrontend/Layout.tsx` - Added AuthButton
- `backend/app/api/upload.py` - Requires auth, stores user_id
- `backend/app/api/jobs.py` - User-scoped job listing
- `backend/app/api/forecast.py` - Requires auth, verifies ownership
- `backend/app/core/config.py` - Added Supabase settings
