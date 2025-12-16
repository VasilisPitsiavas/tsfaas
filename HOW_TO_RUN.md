# 🚀 How to Run Your Application - Complete Guide

## Quick Answer

**You're doing it correctly!** Running frontend and backend separately is **perfect for development**. Here's when to use each approach:

---

## ✅ Option 1: Local Development (What You're Doing Now) - **RECOMMENDED FOR DEVELOPMENT**

**Best for:** Daily development, debugging, quick iteration

### What You Need:
1. **Backend** (Terminal 1):
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```
   ✅ Runs on http://localhost:8000

2. **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   ✅ Runs on http://localhost:3000

3. **Redis** (Terminal 3 or Docker):
   ```bash
   # Option A: Docker (easiest)
   docker run -d -p 6379:6379 --name tsfaas-redis redis:7-alpine
   
   # Option B: Install locally (macOS)
   brew install redis
   redis-server
   ```

### Advantages:
- ✅ **Fastest** - No Docker build time
- ✅ **Hot reload** - Changes reflect immediately
- ✅ **Better debugging** - See errors directly in terminal
- ✅ **Easier to modify** - Edit code and see changes instantly
- ✅ **Less resource usage** - Only runs what you need

### What's Missing:
- ⚠️ **PostgreSQL** - Only needed if you use database features
- ⚠️ **MinIO** - Only needed if you use S3 storage
- ⚠️ **Worker** - Background job processor (needed for forecasts)

**For basic testing (upload, configure), you only need Redis!**

---

## 🐳 Option 2: Docker (Full Stack) - **RECOMMENDED FOR PRODUCTION-LIKE TESTING**

**Best for:** Testing complete flow, production-like environment, CI/CD

### Quick Start:
```bash
# Make sure Docker Desktop is running
docker-compose up --build
```

### What This Starts:
- ✅ **Frontend**: http://localhost:3000
- ✅ **Backend**: http://localhost:8000
- ✅ **PostgreSQL**: Database (port 5432)
- ✅ **Redis**: Job queue (port 6379)
- ✅ **MinIO**: S3 storage (ports 9000, 9001)
- ✅ **Worker**: Background job processor

### Advantages:
- ✅ **Complete stack** - Everything included
- ✅ **Production-like** - Same as production environment
- ✅ **Isolated** - No conflicts with local dependencies
- ✅ **Easy reset** - `docker-compose down` cleans everything

### Disadvantages:
- ⚠️ **Slower** - Docker build time (5-10 min first time)
- ⚠️ **More resources** - Uses more RAM/CPU
- ⚠️ **Harder to debug** - Need to check Docker logs

---

## 🔀 Option 3: Hybrid (Best of Both Worlds)

**Best for:** Services in Docker, code running locally

### Start Services:
```bash
# Start only PostgreSQL, Redis, MinIO in Docker
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

### Advantages:
- ✅ Services managed by Docker
- ✅ Code runs locally (fast, easy to debug)
- ✅ Hot reload for both frontend and backend

---

## 📊 Comparison Table

| Feature | Local Dev | Docker | Hybrid |
|---------|-----------|-------|--------|
| **Speed** | ⚡⚡⚡ Fastest | 🐌 Slower | ⚡⚡ Fast |
| **Debugging** | ✅ Easy | ⚠️ Harder | ✅ Easy |
| **Hot Reload** | ✅ Yes | ⚠️ Limited | ✅ Yes |
| **Complete Stack** | ❌ No | ✅ Yes | ✅ Yes |
| **Setup Time** | ⚡ Quick | 🐌 Slow | ⚡ Quick |
| **Resource Usage** | 💚 Low | 🔴 High | 🟡 Medium |

---

## 🎯 Recommended Workflow

### For Daily Development:
**Use Option 1 (Local Development)** - What you're doing now!
- Fastest iteration
- Best debugging experience
- Only start what you need

### For Testing Complete Flow:
**Use Option 2 (Docker)** - When you want to test everything
- Test full stack
- Verify production-like behavior
- Test worker/background jobs

### For Best Experience:
**Use Option 3 (Hybrid)** - Services in Docker, code local
- Get benefits of both approaches
- Services managed, code debuggable

---

## ⚠️ Important: What You're Missing Right Now

Since you're running locally, you're **missing Redis** which is needed for:
- Job queue (forecast processing)
- Background workers

### Quick Fix:
```bash
# Start Redis in Docker (doesn't interfere with your local setup)
docker run -d -p 6379:6379 --name tsfaas-redis redis:7-alpine

# Or use the script
./start-app.sh  # This starts Redis automatically
```

---

## 🚀 Quick Commands

### Your Current Setup (Local):
```bash
# Terminal 1
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (Redis)
docker run -d -p 6379:6379 redis:7-alpine
```

### Full Docker Setup:
```bash
docker-compose up --build
```

### Hybrid Setup:
```bash
# Start services
docker-compose up postgres redis minio -d

# Run code locally (same as your current setup)
cd backend && source venv/bin/activate && uvicorn main:app --reload
cd frontend && npm run dev
```

---

## ✅ Summary

**You're doing it right!** Local development is perfect for:
- ✅ Daily coding
- ✅ Debugging
- ✅ Quick iteration
- ✅ Learning the codebase

**Add Redis** and you're good to go:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Use Docker** when you want to:
- Test the complete stack
- Verify production behavior
- Test background workers
- Deploy to production

---

## 🆘 Troubleshooting

### "401 Unauthorized" errors:
- Make sure you're logged in at http://localhost:3000
- Check browser console for auth errors
- Try logging out and back in

### "Redis connection error":
- Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
- Or install locally: `brew install redis && redis-server`

### "Port already in use":
- Stop other services using ports 3000, 8000, 6379
- Or change ports in docker-compose.yml

---

**Bottom line:** Keep doing what you're doing! Just add Redis for full functionality. 🎉
