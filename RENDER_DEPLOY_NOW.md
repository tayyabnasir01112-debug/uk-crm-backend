# 🚀 Render Deployment - Quick Guide

## Netlify is Already Deployed! ✅
**Your site**: https://uk-crm-frontend.netlify.app

---

## Now Deploy Render Backend (5 minutes)

### Step 1: Go to Render
Open: https://render.com/dashboard

### Step 2: Create Web Service
1. Click **"New +"** (top right)
2. Click **"Web Service"**

### Step 3: Connect Repository
1. Find **"uk-crm-backend"** in the list
2. Click **"Connect"**

### Step 4: Configure (Copy-Paste These)

**Name:**
```
uk-crm-backend
```

**Environment:**
```
Node
```
(Select from dropdown)

**Region:**
```
EU (Ireland)
```
(Or closest to you)

**Branch:**
```
main
```

**Root Directory:**
```
(leave empty)
```

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Plan:**
```
Free
```
(Click the Free radio button)

### Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** (4 times):

**1. DATABASE_URL**
```
postgresql://neondb_owner:npg_BNLK1khwEq0M@ep-broad-haze-ab8nmjmg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**2. SESSION_SECRET**
```
8a5a8d7d55b4026d80f4381c11dce4b11c85ef0f3c2b09be3c3a1aed5b3a75bd
```

**3. NODE_ENV**
```
production
```

**4. PORT**
```
10000
```

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes
3. **Copy your Render URL** (e.g., `https://uk-crm-backend.onrender.com`)

---

## Step 7: Update Netlify (After Render Deploys)

Once you have your Render URL, run this command:

```bash
netlify env:set VITE_API_URL "YOUR_RENDER_URL_HERE"
```

Replace `YOUR_RENDER_URL_HERE` with your actual Render URL.

---

## Step 8: Update Render CORS

1. Go back to Render dashboard
2. Click on your service
3. Go to **"Environment"** tab
4. Add:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://uk-crm-frontend.netlify.app`
5. Click **"Save Changes"**

---

## ✅ Done!

Your CRM will be fully functional!

**Frontend**: https://uk-crm-frontend.netlify.app
**Backend**: (Your Render URL)

---

**Just follow Steps 1-6 above and you're done!** 🎉

