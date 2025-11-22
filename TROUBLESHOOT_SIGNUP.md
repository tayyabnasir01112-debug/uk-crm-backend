# 🔍 Troubleshooting "Invalid URL" Signup Error

## ✅ What I Just Fixed

1. **Better error messages** - Now shows actual error instead of generic "invalid url"
2. **URL validation** - Checks if URL is valid before making request
3. **Debug logging** - Console logs show the actual URL being used
4. **Network error detection** - Better messages for connection issues

---

## 🔍 How to Debug

### Step 1: Check Browser Console

1. Open your website: https://uk-crm-frontend.netlify.app
2. Press `F12` (Developer Tools)
3. Click **"Console"** tab
4. Try to signup
5. Look for:
   - `API URL: https://...` (shows the URL being used)
   - `API Base URL: ...` (shows the base URL)
   - Any red error messages

### Step 2: Check Network Tab

1. In Developer Tools, click **"Network"** tab
2. Try to signup
3. Look for the `/api/register` request
4. Check:
   - **Status**: Should be 200 (success) or 401/400 (error)
   - **Request URL**: Should be `https://uk-crm-backend.onrender.com/api/register`
   - **Response**: Click to see what the server returned

---

## 🚨 Common Issues & Fixes

### Issue 1: "Cannot connect to server"

**Cause**: Backend is down or unreachable

**Fix**:
1. Check backend: https://uk-crm-backend.onrender.com/health
2. Should show: `{"status":"ok","timestamp":"..."}`
3. If it's down, wait 2-3 minutes (Render cold start)

### Issue 2: "CORS error"

**Cause**: Backend not allowing requests from Netlify domain

**Fix**: Already configured, but if it persists:
1. Check `server/app.ts` CORS settings
2. Verify `FRONTEND_URL` in Render environment variables

### Issue 3: "Invalid API URL: undefined/api/register"

**Cause**: `VITE_API_URL` not being read by frontend

**Fix**:
1. Go to Netlify: https://app.netlify.com/sites/uk-crm-frontend
2. **Site settings** → **Environment variables**
3. Verify `VITE_API_URL` = `https://uk-crm-backend.onrender.com`
4. **Trigger redeploy** (Deploys tab → Trigger deploy)

### Issue 4: "401 Unauthorized" or "409 Conflict"

**Cause**: 
- 401: Already logged in or session issue
- 409: Email already exists

**Fix**: 
- Clear browser cookies
- Try a different email
- Check browser console for specific error message

---

## 🧪 Test the Backend Directly

### Test Health Endpoint:
```bash
curl https://uk-crm-backend.onrender.com/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### Test Register Endpoint:
```bash
curl -X POST https://uk-crm-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'
```

**Expected**: 
- If email exists: `{"message":"User with this email already exists"}`
- If success: `{"message":"User registered and logged in successfully","user":{...}}`

---

## 📋 Quick Checklist

- [ ] Backend is up: https://uk-crm-backend.onrender.com/health
- [ ] `VITE_API_URL` is set in Netlify: `https://uk-crm-backend.onrender.com`
- [ ] Netlify has been redeployed after setting env var
- [ ] Browser console shows correct API URL
- [ ] Network tab shows request going to correct URL
- [ ] No CORS errors in console

---

## 🆘 Still Not Working?

### Share These Details:

1. **Browser Console Output** (screenshot or copy/paste)
2. **Network Tab** - Right-click `/api/register` → Copy → Copy as cURL
3. **Backend Health Check**: https://uk-crm-backend.onrender.com/health
4. **Exact Error Message** from the toast notification

---

## 💡 Pro Tip

The new code will show **much better error messages** in the browser console. Check there first - it will tell you exactly what's wrong!

