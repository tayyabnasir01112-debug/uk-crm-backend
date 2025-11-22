# 🚀 Deploy Now - Step by Step

## Your Neon Connection String (Already Set)
```
postgresql://neondb_owner:npg_BNLK1khwEq0M@ep-broad-haze-ab8nmjmg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Step 1: Setup Local Environment (2 minutes)

### Option A: Run Setup Script (Recommended)

```bash
cd C:\Users\ts199\Downloads\UKSmallBizCRM\UKSmallBizCRM
node setup-env.js
```

This will:
- ✅ Create .env file with your Neon connection string
- ✅ Generate a secure session secret
- ✅ Display the session secret (save it for Render)

### Option B: Manual Setup

1. Generate session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Create `.env` file with:
```
DATABASE_URL=postgresql://neondb_owner:npg_BNLK1khwEq0M@ep-broad-haze-ab8nmjmg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=your-generated-secret-here
NODE_ENV=development
PORT=5000
```

---

## Step 2: Initialize Database (1 minute)

```bash
npm install
npm run db:push
```

This creates all tables in your Neon database.

---

## Step 3: Push to GitHub (2 minutes)

```bash
git init
git add .
git commit -m "Initial commit - UK Small Business CRM"
git remote add origin https://github.com/tayyabnasir01112-debug/uk-crm-backend.git
git branch -M main
git push -u origin main
```

**If you get errors**, try:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

Or force push (if repo is empty):
```bash
git push -u origin main --force
```

---

## Step 4: Deploy Backend to Render (5 minutes)

### 4.1 Create Web Service

1. Go to [render.com](https://render.com)
2. Make sure you're logged in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Find **"uk-crm-backend"** repository
5. Click **"Connect"**

### 4.2 Configure Settings

**Name**: `uk-crm-backend`

**Environment**: `Node`

**Region**: `EU (Ireland)` or closest to you

**Branch**: `main`

**Build Command**: 
```
npm install && npm run build
```

**Start Command**: 
```
npm start
```

**Plan**: **Free**

### 4.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

1. **DATABASE_URL**
   ```
   postgresql://neondb_owner:npg_BNLK1khwEq0M@ep-broad-haze-ab8nmjmg-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

2. **SESSION_SECRET**
   ```
   [Use the secret from Step 1 - check .env file or run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
   ```

3. **NODE_ENV**
   ```
   production
   ```

4. **PORT**
   ```
   10000
   ```

### 4.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes
3. **Copy your Render URL** (e.g., `https://uk-crm-backend.onrender.com`)
4. **Save this URL** - you'll need it for Netlify

---

## Step 5: Deploy Frontend to Netlify (5 minutes)

### 5.1 Import Project

1. Go to: https://app.netlify.com/teams/tayyabnasirsiddiqui/projects
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify (if prompted)
5. Select **"uk-crm-backend"** repository

### 5.2 Configure Build

**Build command**: 
```
npm install && npm run build
```

**Publish directory**: 
```
dist/public
```

### 5.3 Add Environment Variable

Click **"Show advanced"** → **"New variable"**:

**Variable name**: `VITE_API_URL`

**Value**: Your Render backend URL (from Step 4.4)
- Example: `https://uk-crm-backend.onrender.com`

### 5.4 Deploy

1. Click **"Deploy site"**
2. Wait 3-5 minutes
3. **Copy your Netlify URL** (e.g., `https://random-name-12345.netlify.app`)

---

## Step 6: Update Render CORS (Important!)

1. Go back to Render dashboard
2. Click on your service (`uk-crm-backend`)
3. Go to **"Environment"** tab
4. Add/Update **FRONTEND_URL**:
   - Value: Your Netlify URL (from Step 5.4)
   - Example: `https://random-name-12345.netlify.app`
5. Click **"Save Changes"**
6. Render will automatically redeploy (wait 2-3 minutes)

---

## Step 7: Test Your Application

1. Visit your Netlify URL
2. Click **"Get Started"** or go to `/login`
3. **Register** a new account:
   - Email: `test@example.com`
   - Password: `test123456`
4. Complete onboarding
5. Test features

---

## ✅ Quick Checklist

- [ ] Step 1: Run `node setup-env.js` (or create .env manually)
- [ ] Step 2: Run `npm install && npm run db:push`
- [ ] Step 3: Push code to GitHub
- [ ] Step 4: Deploy backend to Render
- [ ] Step 5: Deploy frontend to Netlify
- [ ] Step 6: Add FRONTEND_URL to Render
- [ ] Step 7: Test application

---

## 📋 Your URLs (Save These)

- **Neon**: https://console.neon.tech/app/projects/round-band-21147885
- **GitHub**: https://github.com/tayyabnasir01112-debug/uk-crm-backend
- **Render Backend**: `https://your-service.onrender.com` (after deployment)
- **Netlify Frontend**: `https://your-site.netlify.app` (after deployment)

---

## 🆘 Troubleshooting

### Backend Not Working
- Check Render logs: Dashboard → Service → Logs
- Verify all 4 environment variables are set
- Check DATABASE_URL is correct (copy from above)

### Frontend Can't Connect
- Check `VITE_API_URL` is set in Netlify
- Verify Render URL is correct
- Make sure FRONTEND_URL is set in Render

### Database Issues
- Database is already set up with your connection string
- Tables will be created automatically on first use
- Or run `npm run db:push` locally

---

## 🎉 You're Done!

Once all steps are complete, your CRM will be live and accessible from anywhere!

**Total time: ~20 minutes**

