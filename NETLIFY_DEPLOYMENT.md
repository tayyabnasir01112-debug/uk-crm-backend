# Free Netlify Deployment Guide

This guide will help you deploy your UK Small Business CRM completely free using:
- **Netlify** (Free) - Frontend hosting
- **Render** (Free) - Backend hosting  
- **Neon** (Free) - PostgreSQL database
- **Local Authentication** (Free) - No third-party auth services needed

## Total Cost: $0/month

---

## Prerequisites

1. GitHub account (free)
2. Netlify account (free)
3. Render account (free)
4. Neon account (free)

---

## Step 1: Set Up Free PostgreSQL Database (Neon) - RECOMMENDED ✅

1. Go to [neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project
3. Copy your **Connection String** (looks like: `postgresql://user:password@host/database?sslmode=require`)
4. Save this for later - you'll need it for environment variables

**Neon Free Tier Includes:**
- ✅ **0.5GB storage** - Perfect for starting out (100-150 users: ~1-3GB needed, may need upgrade after 6-12 months)
- ✅ **Unlimited projects** - Create multiple databases
- ✅ **Serverless PostgreSQL** - Auto-scales with your app
- ✅ **Automatic backups** - Daily backups included
- ✅ **No credit card required** - Completely free
- ✅ **Free forever** - No time limits

**Alternative Free Databases:**
- **Supabase**: 500MB database + 2GB file storage (free)
- **Railway**: $5 credit/month (usually covers 1-2GB)

See `FREE_NETLIFY_DATABASE.md` for detailed comparison of all free database options.

---

## Step 2: Prepare Your Code

### 2.1 Update Environment Variables

Create a `.env` file in your project root (don't commit this to Git):

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-key-here

# Node Environment
NODE_ENV=production
```

**Generate Session Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 Initialize Database

Run the database migrations:

```bash
npm install
npm run db:push
```

This will create all necessary tables in your Neon database.

---

## Step 3: Deploy Backend to Render (Free)

Render offers a free tier that's perfect for Node.js backends.

### 3.1 Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

### 3.2 Deploy on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `uk-crm-backend` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

5. Add Environment Variables:
   - `DATABASE_URL` - Your Neon connection string
   - `SESSION_SECRET` - Your generated secret
   - `NODE_ENV` - `production`
   - `PORT` - `10000` (Render uses port 10000)

6. Click **"Create Web Service"**

**Render Free Tier:**
- 750 hours/month (enough for 24/7 operation)
- Spins down after 15 minutes of inactivity (wakes up on first request)
- Perfect for small businesses

**Note:** Your backend URL will be: `https://uk-crm-backend.onrender.com` (or similar)

---

## Step 4: Deploy Frontend to Netlify (Free)

### 4.1 Update API Endpoints

Before deploying, you need to update your frontend to point to your Render backend.

Create a `.env` file in your project root for frontend:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

Then update your API calls to use this environment variable.

### 4.2 Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/public`
5. Add Environment Variables (if needed):
   - `VITE_API_URL` - Your Render backend URL
6. Click **"Deploy site"**

**Netlify Free Tier:**
- 100GB bandwidth/month
- 300 build minutes/month
- Custom domain support
- SSL certificates (free)
- Perfect for frontend hosting

---

## Step 5: Connect Custom Domain (Optional)

### 5.1 On Netlify

1. Go to your site settings
2. Click **"Domain settings"**
3. Click **"Add custom domain"**
4. Enter your domain name
5. Follow the DNS configuration instructions

### 5.2 Update Backend CORS (If Needed)

If your frontend and backend are on different domains, update CORS settings in your Express app to allow your Netlify domain.

---

## Step 6: Test Your Deployment

1. Visit your Netlify URL
2. Register a new account
3. Complete onboarding
4. Test all features

---

## Environment Variables Summary

### Backend (Render)
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret
NODE_ENV=production
PORT=10000
```

### Frontend (Netlify)
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Cost Breakdown

| Service | Plan | Cost | Storage/Limits |
|---------|------|------|----------------|
| Netlify | Free | $0/month | 100GB bandwidth/month |
| Render | Free | $0/month | 750 hours/month (spins down after 15min) |
| Neon | Free | $0/month | **0.5GB storage** (may need upgrade after 6-12 months) |
| Domain | Optional | ~$10-15/year | Your custom domain |
| **Total** | | **$0/month** | **Completely free!** |

**Note**: For 100-150 users, you'll likely need to upgrade Neon to Pro ($19/month for 10GB) after 6-12 months when you exceed 0.5GB. Still very affordable!

---

## Important Notes

### Render Free Tier Limitations

- **Spins down after 15 minutes** of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 hours/month (enough for 24/7 if you stay within limits)
- If you exceed 750 hours, you'll need to upgrade ($7/month)

### Neon Free Tier Limitations

- **0.5GB storage** - Good for starting out (50-100 users, 6-12 months)
- **For 100-150 users**: You'll likely need ~1-3GB, so may need upgrade after 6-12 months
- **Upgrade to Pro**: $19/month for 10GB (when you exceed 0.5GB)
- **Alternative**: Use Supabase free tier (500MB + 2GB file storage) or Railway ($5 credit/month)

See `FREE_NETLIFY_DATABASE.md` for detailed comparison of all free database options.

### Netlify Free Tier Limitations

- **100GB bandwidth/month** - Usually enough for small sites
- **300 build minutes/month** - Plenty for occasional deployments

---

## Scaling Options (When You Grow)

If you need more resources:

1. **Render**: Upgrade to Starter ($7/month) for always-on service
2. **Neon**: Upgrade to Pro ($19/month) for 10GB storage
3. **Netlify**: Pro plan ($19/month) for more bandwidth and features

**Total for scaling**: ~$45/month (still very affordable)

---

## Troubleshooting

### Backend Not Responding

- Check Render logs: Dashboard → Your Service → Logs
- Verify environment variables are set correctly
- Check if service spun down (first request will be slow)

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check if SSL mode is required: add `?sslmode=require` to connection string
- Verify database is accessible from Render's IPs

### Frontend Can't Connect to Backend

- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Check browser console for errors

---

## Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)

---

## Security Checklist

Before going live:

- [ ] Generate a strong `SESSION_SECRET`
- [ ] Use HTTPS (automatic with Netlify)
- [ ] Set secure cookie flags (already configured)
- [ ] Don't commit `.env` files to Git
- [ ] Use environment variables for all secrets
- [ ] Enable database backups (Neon Pro includes this)

---

**You're all set! Your CRM is now running completely free! 🎉**

