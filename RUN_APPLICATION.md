# 🚀 How to Run Your Application

Your Supabase credentials are already configured! Here are all the ways to run your application.

## ✅ Credentials Status

- ✅ **Docker**: `.env` file in project root (configured)
- ✅ **Frontend Local**: `frontend/.env.local` (configured)
- ✅ **Backend Local**: `backend/.env` (configured)

---

## Option 1: Docker (Recommended - Full Stack) 🐳

**Best for:** Production-like environment, all services included, easiest setup

### Quick Start:
```bash
# Make sure Docker Desktop is running
# Then from project root:
docker-compose up --build
```

### What This Starts:
- ✅ Frontend: http://localhost:3000
- ✅ Backend API: http://localhost:8000
- ✅ PostgreSQL Database
- ✅ Redis (Job Queue)
- ✅ MinIO (S3 Storage)
- ✅ Worker (Background Jobs)

### Stop:
```bash
docker-compose down
```

### View Logs:
```bash
docker-compose logs -f
```

### Advantages:
- ✅ All services included (no manual setup)
- ✅ Production-like environment
- ✅ Isolated dependencies
- ✅ Easy to reset/clean

---

## Option 2: Local Development (Frontend + Backend) 💻

**Best for:** Quick iteration, debugging, development

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
uvicorn main:app --reload
# Backend runs on http://localhost:8000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Note:
For full functionality, you'll also need:
- **Redis** (for job queue): 
  ```bash
  # Install Redis (macOS):
  brew install redis
  redis-server
  
  # Or use Docker just for Redis:
  docker run -d -p 6379:6379 redis:7-alpine
  ```

- **PostgreSQL** (optional - only if using database features)
- **MinIO** (optional - only if using S3 storage)

---

## Option 3: Quick Start Script 🚀

**Best for:** Fast local development setup

```bash
# From project root:
./start-dev.sh
```

This automatically:
- ✅ Activates Python venv
- ✅ Installs dependencies
- ✅ Starts backend in background
- ✅ Starts frontend
- ✅ Shows you the URLs

Press `Ctrl+C` to stop both servers.

---

## Option 4: Docker for Services Only (Hybrid) 🔀

**Best for:** Running services in Docker, but code locally

### Start Services:
```bash
# Start only the services (PostgreSQL, Redis, MinIO)
docker-compose up postgres redis minio -d
```

### Run Code Locally:
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

This gives you:
- ✅ Services in Docker (PostgreSQL, Redis, MinIO)
- ✅ Code running locally (easier debugging)
- ✅ Hot reload for both frontend and backend

---

## 📋 Step-by-Step: First Time Setup

### For Docker (Easiest):

1. **Make sure Docker Desktop is running**
   - Check Docker icon in menu bar (Mac) or system tray (Windows)
   - If not running, open Docker Desktop app

2. **Start the application:**
   ```bash
   cd /Users/vasilispitsiavas/Documents/projects25/tsfaas
   docker-compose up --build
   ```

3. **Wait for build to complete** (first time takes 5-10 minutes)

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - MinIO Console: http://localhost:9001 (admin/minioadmin)

### For Local Development:

1. **Start Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt  # If not already done
   uvicorn main:app --reload
   ```

2. **Start Frontend (new terminal):**
   ```bash
   cd frontend
   npm install  # If not already done
   npm run dev
   ```

3. **Start Redis (new terminal):**
   ```bash
   # Option A: Install locally
   brew install redis
   redis-server
   
   # Option B: Use Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

4. **Access:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

---

## 🔍 Troubleshooting

### Docker Issues:

**"Cannot connect to Docker daemon"**
- Make sure Docker Desktop is running
- Wait a few seconds after starting Docker Desktop

**"Port already in use"**
- Stop other services using ports 3000, 8000, 5432, 6379, 9000, 9001
- Or change ports in `docker-compose.yml`

**Build fails**
- Check logs: `docker-compose logs`
- Try: `docker-compose down` then `docker-compose up --build`

### Local Development Issues:

**Backend won't start**
- Make sure venv is activated: `source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- Check Python version: `python3 --version` (needs 3.9+)

**Frontend won't start**
- Install dependencies: `npm install`
- Check Node version: `node --version` (needs 18+)
- Clear cache: `rm -rf .next node_modules && npm install`

**Redis connection error**
- Make sure Redis is running: `redis-cli ping` (should return PONG)
- Or use Docker: `docker run -d -p 6379:6379 redis:7-alpine`

---

## 🎯 Recommended Workflow

### Development:
- **Use Option 2 or 3** (Local Development)
- Faster iteration
- Better debugging
- Hot reload

### Testing Full Stack:
- **Use Option 1** (Docker)
- Production-like environment
- All services included
- Test complete flow

### Production:
- **Use Docker** with production configs
- Build optimized images
- Use environment variables from secure storage

---

## 📝 Environment Variables

Your credentials are already configured in:

1. **`.env`** (Docker) - Root directory
   - Used by `docker-compose.yml`
   - Contains Supabase URL and keys

2. **`frontend/.env.local`** (Local Frontend)
   - Used by Next.js in development
   - Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **`backend/.env`** (Local Backend)
   - Used by FastAPI
   - Contains `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**Note:** All `.env` files are in `.gitignore` and won't be committed to git.

---

## 🚀 Quick Commands Reference

```bash
# Docker - Start everything
docker-compose up --build

# Docker - Start in background
docker-compose up -d --build

# Docker - Stop everything
docker-compose down

# Docker - View logs
docker-compose logs -f

# Docker - Restart specific service
docker-compose restart backend

# Local - Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Local - Frontend
cd frontend && npm run dev

# Quick Start Script
./start-dev.sh
```

---

## ✅ Next Steps

1. **Choose your preferred method** (Docker recommended for first time)
2. **Start the application**
3. **Visit http://localhost:3000**
4. **Sign up/Sign in** with Supabase authentication
5. **Test the full flow:** Upload → Configure → View Results

Your Supabase credentials are already configured, so authentication should work immediately! 🎉

