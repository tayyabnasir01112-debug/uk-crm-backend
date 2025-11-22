# 📸 Netlify Deployment - Step by Step Guide

## Your Netlify Configuration

### Step 1: Go to Netlify
1. Open: https://app.netlify.com/teams/tayyabnasirsiddiqui/projects
2. Make sure you're logged in

### Step 2: Import Project
1. Click **"Add new site"** button (top right)
2. Click **"Import an existing project"**

### Step 3: Connect to GitHub
1. Click **"Deploy with GitHub"**
2. If prompted, authorize Netlify
3. Find **"uk-crm-backend"** in the repository list
4. Click on it

### Step 4: Configure Build Settings

Fill in these exact values:

**Branch to deploy:**
```
main
```
*(Select from dropdown)*

**Build command:**
```
npm install && npm run build
```

**Publish directory:**
```
dist/public
```

### Step 5: Add Environment Variable

1. Click **"Show advanced"** (below build settings)
2. Click **"New variable"** button
3. Fill in:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Render backend URL
     - Example: `https://uk-crm-backend.onrender.com`
     - *(Use the actual URL from your Render deployment)*

### Step 6: Deploy
1. Click **"Deploy site"** button
2. Wait 3-5 minutes
3. When it says "Published", copy your site URL
   - Looks like: `https://random-name-12345.netlify.app`
4. **SAVE THIS URL** - you'll need it for Render CORS!

---

## After Deployment

1. Visit your Netlify URL
2. Test the application
3. Go back to Render and add FRONTEND_URL (see RENDER_STEP_BY_STEP.md)

---

**That's it for Netlify!** ✅

