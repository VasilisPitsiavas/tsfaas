# 🔍 How to Debug Network Errors

When you see "Network Error" in the UI, here's how to find the actual problem:

---

## 🎯 Quick Steps

### 1. **Browser DevTools (Most Important!)**

**Open DevTools:**
- **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Firefox**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
- **Safari**: Enable Developer menu first, then `Cmd+Option+I`

**Check Console Tab:**
- Look for red error messages
- The console shows detailed error information
- Look for `[API]` prefixed messages (from our API client)

**Check Network Tab:**
1. Click on the **Network** tab
2. Try uploading again
3. Find the failed request (usually red)
4. Click on it to see:
   - **Headers**: Request and response headers
   - **Payload**: What was sent
   - **Response**: What the server returned
   - **Preview**: Formatted response

**Look for:**
- Status code (400, 401, 500, etc.)
- Response body (error message)
- CORS errors
- Authentication errors

---

### 2. **Backend Logs**

**View logs in real-time:**
```bash
docker-compose logs backend -f
```

**View last 100 lines:**
```bash
docker-compose logs backend --tail=100
```

**Filter for errors:**
```bash
docker-compose logs backend | grep -i error
docker-compose logs backend | grep -i exception
```

**What to look for:**
- Python tracebacks
- HTTP status codes
- Error messages
- Authentication failures

---

### 3. **Frontend Logs**

**View logs:**
```bash
docker-compose logs frontend -f
```

**What to look for:**
- Build errors
- Runtime errors
- API call failures

---

### 4. **Test Backend Directly**

**Test OPTIONS (CORS preflight):**
```bash
curl -X OPTIONS http://localhost:8000/api/upload \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type' \
  -v
```

**Test POST (with auth token):**
```bash
# First, get your auth token from browser:
# 1. Open DevTools → Application → Cookies
# 2. Find supabase-auth-token
# 3. Copy the value

curl -X POST http://localhost:8000/api/upload \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/test.csv' \
  -v
```

---

## 🔍 Common Error Patterns

### "Network Error" (Generic)

**Possible causes:**
1. **CORS issue** - Check Network tab, look for CORS errors
2. **Backend not running** - Check `docker-compose ps`
3. **Wrong API URL** - Check `NEXT_PUBLIC_API_URL` in frontend
4. **Connection refused** - Backend not accessible

**Debug:**
- Check browser Network tab
- Check backend logs
- Verify backend is running: `curl http://localhost:8000/health`

---

### 400 Bad Request

**Possible causes:**
1. **Missing required fields**
2. **Invalid file format**
3. **CORS preflight failing**
4. **Malformed request**

**Debug:**
- Check Network tab → Request Payload
- Check backend logs for validation errors
- Verify request format matches API expectations

---

### 401 Unauthorized

**Possible causes:**
1. **Not logged in**
2. **Token expired**
3. **Token not sent**
4. **Invalid token**

**Debug:**
- Check browser Console for `[API]` messages
- Check if token is being sent: Network tab → Headers → Authorization
- Try logging out and back in
- Check backend logs for auth errors

---

### 500 Internal Server Error

**Possible causes:**
1. **Backend code error**
2. **Database connection issue**
3. **Missing environment variables**
4. **File system permissions**

**Debug:**
- Check backend logs (full traceback)
- Check if all services are running: `docker-compose ps`
- Verify environment variables: `docker-compose exec backend env`

---

## 📊 Step-by-Step Debugging

### When Upload Fails:

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Clear network log** (trash icon)
4. **Try uploading again**
5. **Find the failed request** (red, usually `/api/upload`)
6. **Click on it** and check:
   - **Status**: What HTTP status code?
   - **Headers → Request Headers**: Is Authorization header present?
   - **Headers → Response Headers**: Any CORS headers?
   - **Response**: What error message?
   - **Preview**: Formatted error (if JSON)

7. **Check Console tab** for JavaScript errors

8. **Check backend logs**:
   ```bash
   docker-compose logs backend -f
   ```

9. **Compare with expected:**
   - Should see: `POST /api/upload HTTP/1.1 200 OK`
   - If 401: Auth issue
   - If 400: Request format issue
   - If 500: Backend error

---

## 🛠️ Quick Fixes

### If CORS Error:
- Check `CORS_ORIGINS` in backend environment
- Verify frontend URL matches allowed origins
- Restart backend: `docker-compose restart backend`

### If 401 Error:
- Check if logged in (look for AuthButton in UI)
- Check browser console for `[API] No session found`
- Try logging out and back in
- Check backend logs for auth errors

### If Network Error:
- Verify backend is running: `docker-compose ps`
- Check backend health: `curl http://localhost:8000/health`
- Check frontend can reach backend
- Verify `NEXT_PUBLIC_API_URL` is correct

---

## 💡 Pro Tips

1. **Always check browser DevTools first** - it shows the actual error
2. **Network tab is your friend** - shows exactly what's being sent/received
3. **Console tab shows JavaScript errors** - often the root cause
4. **Backend logs show server-side errors** - Python exceptions, etc.
5. **Use `-f` flag** to follow logs in real-time

---

## 📝 Example: Debugging Upload Error

```bash
# 1. Open browser DevTools (F12)
# 2. Go to Network tab
# 3. Try uploading
# 4. See error: "Network Error"

# 5. Check Network tab:
#    - Request: POST /api/upload
#    - Status: 401 Unauthorized
#    - Response: {"detail": "Authentication required"}

# 6. Check Console tab:
#    - [API] No session found for request: /api/upload

# 7. Check backend logs:
docker-compose logs backend | tail -20
#    - INFO: ... "POST /api/upload HTTP/1.1" 401 Unauthorized

# 8. Solution: User not logged in!
#    - Check AuthButton in UI
#    - Log in first
```

---

**Remember:** The browser DevTools Network tab is the best tool for debugging network errors! 🎯
