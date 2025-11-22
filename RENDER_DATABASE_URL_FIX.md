# 🔴 URGENT: Fix DATABASE_URL in Render

## The Problem

The backend is getting the literal string `'DATABASE_URL'` instead of your actual Neon connection string. This means the environment variable is **not set in Render**.

## The Fix (2 minutes)

### Step 1: Get Your Neon Connection String

1. Go to: https://console.neon.tech/app/projects/round-band-21147885
2. Click on your project
3. Click **"Connection Details"** or **"Connection String"**
4. Copy the connection string (should look like: `postgresql://user:password@host/database?sslmode=require`)

### Step 2: Add to Render

1. Go to: https://render.com/dashboard
2. Click on **"uk-crm-backend"**
3. Click **"Environment"** tab (left sidebar)
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your Neon connection string
6. Click **"Save Changes"**
7. Render will automatically redeploy

### Step 3: Verify

After redeploy (2-3 minutes), check the logs:
- Should see: `[express] serving on port 10000`
- Should NOT see: `Invalid URL` errors

## Quick Test

After setting DATABASE_URL, try signup again. It should work!

---

**The connection string should look like:**
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

Make sure you copy the **entire** connection string from Neon!

