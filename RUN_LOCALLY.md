# 🚀 Run Application Locally (Recommended)

Since Docker is having build issues with Supabase packages, **running locally is faster and easier** for development.

## Quick Start

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```
✅ Backend runs on http://localhost:8000

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
✅ Frontend runs on http://localhost:3000

### Terminal 3 - Redis (for job queue):
```bash
# Option A: Install locally
brew install redis
redis-server

# Option B: Use Docker just for Redis
docker run -d -p 6379:6379 redis:7-alpine
```

## Access Your App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Your Credentials Are Already Configured!

- ✅ `frontend/.env.local` - Supabase URL and anon key
- ✅ `backend/.env` - Supabase URL and service role key

## Test Authentication

1. Visit http://localhost:3000
2. Sign up with your email
3. Check email for confirmation link
4. Sign in
5. Access protected routes (Dashboard, Upload, etc.)

## Advantages of Local Development

- ✅ Faster iteration (no Docker build time)
- ✅ Better debugging
- ✅ Hot reload for both frontend and backend
- ✅ Easier to see errors
- ✅ No Docker cache issues

## When You Need Full Stack

If you need PostgreSQL, MinIO, etc., you can run just those services in Docker:

```bash
docker-compose up postgres redis minio -d
```

Then run your code locally as shown above.

