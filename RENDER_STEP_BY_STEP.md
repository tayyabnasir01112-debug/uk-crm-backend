# 📸 Render Deployment - Step by Step with Screenshots Guide

## Your Render Configuration

### Step 1: Go to Render
1. Open: https://render.com
2. Make sure you're logged in with GitHub

### Step 2: Create Web Service
1. Click **"New +"** button (top right)
2. Click **"Web Service"**

### Step 3: Connect Repository
1. Find **"uk-crm-backend"** in the list
2. Click **"Connect"**

### Step 4: Fill in These Exact Values

**Name:**
```
uk-crm-backend
```

**Environment:**
```
Node
```
*(Select from dropdown)*

**Region:**
```
EU (Ireland)
```
*(Or closest to you)*

**Branch:**
```
main
```

**Root Directory:**
```
(leave empty - don't type anything)
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
*(Click the "Free" radio button)*

### Step 5: Add Environment Variables

1. Scroll down and click **"Advanced"**
2. You'll see "Environment Variables" section
3. Click **"Add Environment Variable"** for each one:

#### Variable 1:
- **Key**: `DATABASE_URL`
- **Value**: `postgresql://neondb_owner:npg_BNLK1khwEq0M@ep-broad-haze-ab8nmjmg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

#### Variable 2:
- **Key**: `SESSION_SECRET`
- **Value**: `8a5a8d7d55b4026d80f4381c11dce4b11c85ef0f3c2b09be3c3a1aed5b3a75bd`

#### Variable 3:
- **Key**: `NODE_ENV`
- **Value**: `production`

#### Variable 4:
- **Key**: `PORT`
- **Value**: `10000`

### Step 6: Deploy
1. Scroll to bottom
2. Click **"Create Web Service"**
3. Wait 5-10 minutes
4. Copy your service URL (e.g., `https://uk-crm-backend.onrender.com`)

---

## After Netlify Deployment - Add FRONTEND_URL

1. Go back to Render dashboard
2. Click on **"uk-crm-backend"** service
3. Click **"Environment"** tab (left sidebar)
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Netlify URL (e.g., `https://random-name-12345.netlify.app`)
6. Click **"Save Changes"**
7. Wait 2-3 minutes for redeploy

---

**That's it for Render!** ✅

