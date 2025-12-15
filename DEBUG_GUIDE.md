# 🔍 Debug Guide - Testing Upload Flow

## ✅ Services Running

All containers are up and running:
- ✅ Frontend: http://localhost:3000
- ✅ Backend: http://localhost:8000
- ✅ Worker: Running
- ✅ Redis: Running
- ✅ PostgreSQL: Running
- ✅ MinIO: Running

---

## 📊 How to Monitor Logs

### **Option 1: Watch Logs in Real-Time (Recommended)**

Open **3 terminal windows**:

#### **Terminal 1: Backend Logs**
```bash
cd /Users/vasilispitsiavas/Documents/projects25/tsfaas
docker-compose logs -f backend
```

#### **Terminal 2: Frontend Logs**
```bash
cd /Users/vasilispitsiavas/Documents/projects25/tsfaas
docker-compose logs -f frontend
```

#### **Terminal 3: Worker Logs**
```bash
cd /Users/vasilispitsiavas/Documents/projects25/tsfaas
docker-compose logs -f worker
```

**Press `Ctrl+C` to stop watching logs**

---

### **Option 2: Check Logs After Testing**

```bash
# Backend logs
docker-compose logs backend --tail=50

# Frontend logs
docker-compose logs frontend --tail=50

# Worker logs
docker-compose logs worker --tail=50

# All logs together
docker-compose logs --tail=50
```

---

## 🧪 Testing Steps

1. **Open Browser:**
   - Go to: http://localhost:3000/upload
   - Open DevTools (F12 or Cmd+Option+I)
   - Go to **Console** tab
   - Go to **Network** tab

2. **Upload a File:**
   - Click "Choose File" or drag & drop
   - Select a CSV file (you can use `sample_data/ecommerce_sales.csv`)
   - Wait for file preview to appear

3. **Click "Continue to Configuration":**
   - Watch the browser console for:
     - `"Starting file upload..."`
     - `"Upload response received:"`
     - Any error messages
   - Watch the Network tab for:
     - Request to `/api/upload`
     - Status code (200 = success, 4xx/5xx = error)
   - Watch terminal logs for:
     - Backend receiving the request
     - Any errors

4. **What to Look For:**

   **✅ Success Indicators:**
   - Console: "Upload response received:" with job_id
   - Network: POST /api/upload returns 200
   - Backend logs: "POST /api/upload" with 200 status
   - Page navigates to /configure?job_id=...

   **❌ Error Indicators:**
   - Console: Error messages (red text)
   - Network: Failed request (red) or CORS error
   - Backend logs: Error stack trace
   - Toast notification: Error message

---

## 🐛 Common Issues & Solutions

### **Issue: "Network Error" or "Failed to fetch"**
- **Cause:** Backend not running or CORS issue
- **Check:** `docker-compose ps` - is backend running?
- **Fix:** `docker-compose restart backend`

### **Issue: "CORS policy" error**
- **Cause:** Backend CORS not configured for frontend URL
- **Check:** Backend logs for CORS errors
- **Fix:** Check `backend/app/core/config.py` CORS_ORIGINS

### **Issue: "404 Not Found"**
- **Cause:** API endpoint doesn't exist
- **Check:** Backend logs for route not found
- **Fix:** Verify API routes are registered

### **Issue: "500 Internal Server Error"**
- **Cause:** Backend error processing request
- **Check:** Backend logs for full error stack trace
- **Fix:** Check backend code for the error

### **Issue: Navigation doesn't happen**
- **Cause:** Router.push failed or job_id missing
- **Check:** Console for navigation errors
- **Fix:** Verify job_id is in upload response

---

## 📝 What I Added for Debugging

In `Upload.tsx`, I added:
- ✅ Console.log statements to track flow
- ✅ Better error messages
- ✅ Validation of upload response
- ✅ Detailed error logging

You should see in browser console:
```
Starting file upload... {fileName: "...", size: ...}
Upload response received: {job_id: "...", columns: [...]}
Navigating to: /configure?job_id=...
```

---

## 🎯 Quick Commands

```bash
# Check all containers status
docker-compose ps

# Watch all logs together
docker-compose logs -f

# Watch specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Check last 100 lines
docker-compose logs --tail=100 backend

# Restart a service
docker-compose restart backend
docker-compose restart frontend

# Stop everything
docker-compose down
```

---

## 📊 Expected Flow

1. **User clicks "Continue"**
   - Frontend: Console shows "Starting file upload..."
   - Network: POST request to http://localhost:8000/api/upload

2. **Backend receives request**
   - Backend logs: "POST /api/upload HTTP/1.1"
   - Backend processes file
   - Backend returns: {job_id, columns, preview}

3. **Frontend receives response**
   - Console: "Upload response received:" with data
   - localStorage: Stores job_id and upload data
   - Navigation: Router pushes to /configure?job_id=...

4. **Configure page loads**
   - Reads job_id from URL params
   - Loads upload data from API or localStorage
   - Displays column selector

---

**Ready to test!** 🚀
