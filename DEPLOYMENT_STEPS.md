# Step-by-Step Deployment Guide

## Your Setup Details

- **Neon Database**: https://console.neon.tech/app/projects/round-band-21147885
- **GitHub**: https://github.com/tayyabnasir01112-debug
- **Backend Repo**: https://github.com/tayyabnasir01112-debug/uk-crm-backend
- **Netlify**: https://app.netlify.com/teams/tayyabnasirsiddiqui/projects

---

## Step 1: Get Neon Connection String

1. Go to: https://console.neon.tech/app/projects/round-band-21147885
2. Click on your project
3. Look for **"Connection String"** or **"Connection Details"**
4. Copy the connection string (looks like: `postgresql://user:password@host/database?sslmode=require`)
5. **Save this** - you'll need it for Render

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git (if not already done)

```bash
cd C:\Users\ts199\Downloads\UKSmallBizCRM\UKSmallBizCRM
git init
git add .
git commit -m "Initial commit - UK Small Business CRM"
```

### 2.2 Add GitHub Remote and Push

```bash
git remote add origin https://github.com/tayyabnasir01112-debug/uk-crm-backend.git
git branch -M main
git push -u origin main
```

**Note**: If the repo is empty, this will work. If you get errors, you may need to pull first or force push.

---

## Step 3: Generate Session Secret

Run this command to generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** - you'll need it for Render environment variables.

---

## Step 4: Deploy Backend to Render

### 4.1 Create Web Service on Render

1. Go to [render.com](https://render.com)
2. Make sure you're logged in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect repository: Select **"uk-crm-backend"**
5. Click **"Connect"**

### 4.2 Configure Build Settings

**Name**: `uk-crm-backend` (or any name you prefer)

**Environment**: `Node`

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

Click **"Advanced"** → **"Add Environment Variable"** and add:

1. **DATABASE_URL**
   - Value: Your Neon connection string (from Step 1)
   - Example: `postgresql://user:password@host.neon.tech/database?sslmode=require`

2. **SESSION_SECRET**
   - Value: The random string you generated (from Step 3)
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

3. **NODE_ENV**
   - Value: `production`

4. **PORT**
   - Value: `10000`

### 4.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Copy your service URL** (looks like: `https://uk-crm-backend.onrender.com`)
4. **Save this URL** - you'll need it for Netlify

---

## Step 5: Initialize Database on Neon

### 5.1 Get Database Connection String

1. Go to: https://console.neon.tech/app/projects/round-band-21147885
2. Click on your project
3. Find **"Connection String"** or go to **"Connection Details"**
4. Copy the connection string

### 5.2 Run Database Migrations Locally

On your local machine:

```bash
cd C:\Users\ts199\Downloads\UKSmallBizCRM\UKSmallBizCRM

# Create .env file
echo DATABASE_URL=your-neon-connection-string-here > .env

# Install dependencies (if not already done)
npm install

# Run migrations
npm run db:push
```

**Alternative**: You can also run migrations from Render's shell or use Neon's SQL editor.

---

## Step 6: Deploy Frontend to Netlify

### 6.1 Import Project

1. Go to: https://app.netlify.com/teams/tayyabnasirsiddiqui/projects
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access GitHub (if prompted)
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

### 6.3 Add Environment Variables

Click **"Show advanced"** → **"New variable"** and add:

**VITE_API_URL**
- Value: Your Render backend URL (from Step 4.4)
- Example: `https://uk-crm-backend.onrender.com`

### 6.4 Deploy

1. Click **"Deploy site"**
2. Wait for deployment (3-5 minutes)
3. Your site will be live at: `https://random-name-12345.netlify.app`

---

## Step 7: Update Frontend API Calls (If Needed)

If your frontend code uses hardcoded API URLs, you may need to update them to use the environment variable.

Check if `client/src` files use `VITE_API_URL` or hardcoded URLs.

---

## Step 8: Test Your Deployment

1. **Visit your Netlify URL**
2. **Try to register** a new account
3. **Check if it works**
4. **Check Render logs** if there are errors:
   - Go to Render dashboard → Your service → Logs

---

## Troubleshooting

### Backend Not Working

1. Check Render logs for errors
2. Verify environment variables are set correctly
3. Check if database connection string is correct
4. Verify PORT is set to 10000

### Frontend Can't Connect to Backend

1. Check `VITE_API_URL` is set in Netlify
2. Verify Render backend URL is correct
3. Check browser console for CORS errors
4. May need to update CORS settings in backend

### Database Connection Issues

1. Verify Neon connection string is correct
2. Check if database migrations ran successfully
3. Verify SSL mode is set (`?sslmode=require`)

---

## Quick Reference

### Render Backend URL
- Format: `https://your-service-name.onrender.com`
- Get from: Render dashboard → Your service

### Netlify Frontend URL
- Format: `https://random-name-12345.netlify.app`
- Get from: Netlify dashboard → Your site

### Neon Connection String
- Format: `postgresql://user:password@host.neon.tech/database?sslmode=require`
- Get from: Neon console → Your project → Connection details

---

## Next Steps After Deployment

1. **Test registration/login**
2. **Test all features**
3. **Set up custom domain** (optional)
4. **Monitor usage** (database size, Render hours)
5. **Set up backups** (Neon has automatic backups)

---

## Support

If you encounter issues:
- **Render Logs**: Dashboard → Service → Logs
- **Netlify Logs**: Site → Deploys → Click deploy → Functions/Logs
- **Neon Dashboard**: Check connection status

Good luck with your deployment! 🚀

