# Quick Deployment Guide - Your Setup

## Your Accounts

- **Neon**: https://console.neon.tech/app/projects/round-band-21147885
- **GitHub**: https://github.com/tayyabnasir01112-debug
- **Backend Repo**: https://github.com/tayyabnasir01112-debug/uk-crm-backend
- **Netlify**: https://app.netlify.com/teams/tayyabnasirsiddiqui/projects

---

## Step 1: Get Neon Connection String

1. Go to: https://console.neon.tech/app/projects/round-band-21147885
2. Click on your project
3. Find **"Connection String"** or **"Connection Details"**
4. Copy the connection string
5. **Save it** - you'll need it for Render

**Format**: `postgresql://user:password@host.neon.tech/database?sslmode=require`

---

## Step 2: Generate Session Secret

Open terminal in your project folder and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** - you'll need it for Render.

---

## Step 3: Push Code to GitHub

```bash
cd C:\Users\ts199\Downloads\UKSmallBizCRM\UKSmallBizCRM

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - UK Small Business CRM"

# Add remote and push
git remote add origin https://github.com/tayyabnasir01112-debug/uk-crm-backend.git
git branch -M main
git push -u origin main
```

**Note**: If you get errors, you may need to:
- Pull first: `git pull origin main --allow-unrelated-histories`
- Or force push: `git push -u origin main --force`

---

## Step 4: Deploy Backend to Render

### 4.1 Create Web Service

1. Go to [render.com](https://render.com)
2. Make sure you're logged in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Find and select **"uk-crm-backend"** repository
5. Click **"Connect"**

### 4.2 Configure Settings

**Name**: `uk-crm-backend`

**Environment**: `Node`

**Region**: Choose closest to you

**Branch**: `main`

**Root Directory**: (leave empty)

**Build Command**: 
```
npm install && npm run build
```

**Start Command**: 
```
npm start
```

**Plan**: Select **"Free"**

### 4.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these 4 variables:

1. **DATABASE_URL**
   - Value: Your Neon connection string (from Step 1)

2. **SESSION_SECRET**
   - Value: The random string you generated (from Step 2)

3. **NODE_ENV**
   - Value: `production`

4. **PORT**
   - Value: `10000`

5. **FRONTEND_URL** (optional, but recommended)
   - Value: You'll add this after Netlify deployment
   - Format: `https://your-site-name.netlify.app`

### 4.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. **Copy your service URL** (looks like: `https://uk-crm-backend.onrender.com`)
4. **Save this URL** - you'll need it for Netlify

---

## Step 5: Initialize Database

### Option A: Run Migrations Locally

```bash
# Create .env file
echo DATABASE_URL=your-neon-connection-string-here > .env

# Install dependencies
npm install

# Run migrations
npm run db:push
```

### Option B: Use Neon SQL Editor

1. Go to Neon console
2. Click **"SQL Editor"**
3. The tables will be created automatically when you first use the app

---

## Step 6: Deploy Frontend to Netlify

### 6.1 Import Project

1. Go to: https://app.netlify.com/teams/tayyabnasirsiddiqui/projects
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify (if prompted)
5. Select repository: **"uk-crm-backend"**

### 6.2 Configure Build Settings

**Build command**: 
```
npm install && npm run build
```

**Publish directory**: 
```
dist/public
```

### 6.3 Add Environment Variable

Click **"Show advanced"** → **"New variable"**:

**Variable name**: `VITE_API_URL`

**Value**: Your Render backend URL (from Step 4.4)
- Example: `https://uk-crm-backend.onrender.com`

### 6.4 Deploy

1. Click **"Deploy site"**
2. Wait 3-5 minutes
3. Your site will be live!
4. **Copy your Netlify URL** (looks like: `https://random-name-12345.netlify.app`)

---

## Step 7: Update Render CORS (Important!)

1. Go back to Render dashboard
2. Click on your service
3. Go to **"Environment"** tab
4. Add/Update **FRONTEND_URL**:
   - Value: Your Netlify URL (from Step 6.4)
   - Example: `https://random-name-12345.netlify.app`
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Step 8: Test Your Application

1. Visit your Netlify URL
2. Click **"Get Started"** or go to `/login`
3. **Register** a new account
4. Complete onboarding
5. Test all features

---

## Troubleshooting

### Backend Not Working

1. Check Render logs: Dashboard → Service → Logs
2. Verify all environment variables are set
3. Check if database connection string is correct
4. Make sure PORT is set to 10000

### Frontend Can't Connect to Backend

1. Check `VITE_API_URL` is set in Netlify
2. Verify Render backend URL is correct
3. Check browser console for errors
4. Make sure FRONTEND_URL is set in Render

### Database Connection Issues

1. Verify Neon connection string is correct
2. Check if SSL mode is included (`?sslmode=require`)
3. Run migrations: `npm run db:push`

### CORS Errors

1. Make sure FRONTEND_URL is set in Render
2. Check that it matches your Netlify URL exactly
3. Verify CORS is enabled in backend code

---

## Quick Checklist

- [ ] Neon connection string copied
- [ ] Session secret generated
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Render
- [ ] Environment variables set in Render
- [ ] Database migrations run
- [ ] Frontend deployed to Netlify
- [ ] VITE_API_URL set in Netlify
- [ ] FRONTEND_URL set in Render
- [ ] Application tested

---

## Your URLs (Save These)

- **Backend**: `https://uk-crm-backend.onrender.com` (or your Render URL)
- **Frontend**: `https://random-name-12345.netlify.app` (or your Netlify URL)
- **Neon**: https://console.neon.tech/app/projects/round-band-21147885

---

## Next Steps

1. **Test all features**
2. **Set up custom domain** (optional)
3. **Monitor database size** in Neon
4. **Set up backups** (Neon has automatic backups)

---

## Support

- **Render Logs**: Dashboard → Service → Logs
- **Netlify Logs**: Site → Deploys → Click deploy → Functions/Logs
- **Neon Dashboard**: Check connection status

**Good luck! Your CRM will be live soon!** 🚀

