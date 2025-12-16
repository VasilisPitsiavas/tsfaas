# 🐳 Docker Troubleshooting Guide

## Common Docker Issues and Solutions

---

## ❌ "Cannot connect to the Docker daemon"

### Problem:
```
Cannot connect to the Docker daemon at unix:///Users/.../docker.sock. 
Is the docker daemon running?
```

### Solution:

**1. Start Docker Desktop:**
   - **macOS**: Open Docker Desktop from Applications
   - **Or run**: `open -a Docker`
   - **Or click**: Docker icon in menu bar (top right)

**2. Wait for Docker to start:**
   - Wait 10-30 seconds for Docker to fully start
   - Look for "Docker Desktop is running" in menu bar
   - Docker icon should be solid (not animated)

**3. Verify Docker is running:**
   ```bash
   docker ps
   ```
   Should return list of containers (or empty list, not an error)

**4. Then run docker-compose:**
   ```bash
   docker-compose up
   ```

---

## ❌ "Port already in use"

### Problem:
```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

### Solution:

**Option 1: Stop local servers**
```bash
# Stop frontend
lsof -ti:3000 | xargs kill -9
pkill -f "next dev"

# Stop backend
lsof -ti:8000 | xargs kill -9
pkill -f "uvicorn"

# Stop local Redis (if running)
docker stop tsfaas-redis
```

**Option 2: Change ports in docker-compose.yml**
```yaml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

**Option 3: Find and stop what's using the port**
```bash
# Find what's using port 3000
lsof -i:3000

# Kill it
kill -9 <PID>
```

---

## ❌ "Ports are not available"

### Problem:
```
Error response from daemon: Ports are not available: 
exposing port TCP 0.0.0.0:3000 -> 0.0.0.0:0: 
listen tcp 0.0.0.0:3000: bind: address already in use
```

### Solution:

Same as "Port already in use" - stop local servers first.

---

## ❌ Docker build fails

### Problem:
Build errors during `docker-compose up --build`

### Solution:

**1. Clean Docker cache:**
```bash
docker system prune -a
```

**2. Rebuild without cache:**
```bash
docker-compose build --no-cache
docker-compose up
```

**3. Check logs:**
```bash
docker-compose logs frontend
docker-compose logs backend
```

---

## ❌ Containers won't start

### Problem:
Containers created but not running

### Solution:

**1. Check container status:**
```bash
docker ps -a
```

**2. Check logs:**
```bash
docker-compose logs
docker logs <container-name>
```

**3. Restart containers:**
```bash
docker-compose restart
# Or
docker-compose down
docker-compose up
```

---

## ❌ "No space left on device"

### Problem:
Docker ran out of disk space

### Solution:

**1. Clean up Docker:**
```bash
# Remove unused containers, networks, images
docker system prune -a

# Remove volumes (careful - deletes data!)
docker volume prune
```

**2. Increase Docker disk space:**
- Docker Desktop → Settings → Resources → Disk image size
- Increase allocation

---

## ✅ Quick Health Check

Run these commands to verify everything is working:

```bash
# 1. Check Docker is running
docker ps

# 2. Check ports are free
lsof -i:3000
lsof -i:8000
lsof -i:6379

# 3. Check docker-compose config
docker-compose config

# 4. Check container logs
docker-compose logs --tail=50
```

---

## 🚀 Quick Start Checklist

Before running `docker-compose up`:

- [ ] Docker Desktop is running
- [ ] Ports 3000, 8000, 6379 are free
- [ ] Local dev servers are stopped
- [ ] `.env` file exists with correct values
- [ ] Docker has enough disk space

---

## 💡 Pro Tips

1. **Always stop local servers before Docker:**
   ```bash
   pkill -f "next dev"
   pkill -f "uvicorn"
   ```

2. **Use docker-compose down to clean up:**
   ```bash
   docker-compose down  # Stops and removes containers
   ```

3. **Check what's using ports:**
   ```bash
   lsof -i:3000  # Shows what's using port 3000
   ```

4. **View logs in real-time:**
   ```bash
   docker-compose logs -f  # Follow logs
   ```

5. **Restart specific service:**
   ```bash
   docker-compose restart frontend
   ```

---

## 🆘 Still Having Issues?

1. **Restart Docker Desktop:**
   - Quit Docker Desktop completely
   - Wait 10 seconds
   - Start it again

2. **Check Docker Desktop logs:**
   - Docker Desktop → Troubleshoot → View logs

3. **Reset Docker Desktop:**
   - Docker Desktop → Troubleshoot → Reset to factory defaults
   - ⚠️ This removes all containers and images!

4. **Check system resources:**
   - Make sure you have enough RAM/CPU allocated to Docker
   - Docker Desktop → Settings → Resources

---

## 📚 Useful Commands

```bash
# Start Docker Desktop (macOS)
open -a Docker

# Check Docker status
docker ps
docker info

# Stop all containers
docker-compose down

# Remove everything
docker-compose down -v  # Also removes volumes

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Rebuild specific service
docker-compose build frontend
docker-compose up frontend

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

**Remember:** When switching between local development and Docker, always stop one before starting the other!
