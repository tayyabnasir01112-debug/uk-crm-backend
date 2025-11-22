# Migration Guide: Moving Your CRM to Another Platform

This guide will help you migrate your CRM Launch application from Replit to any other hosting platform or database provider.

## Table of Contents

1. [Overview](#overview)
2. [Exporting Your Data](#exporting-your-data)
3. [Database Migration](#database-migration)
4. [Application Migration](#application-migration)
5. [Environment Variables](#environment-variables)
6. [Deployment Options](#deployment-options)
7. [Common Platforms](#common-platforms)

---

## Overview

Your CRM Launch application is built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL
- **Authentication**: OpenID Connect (Replit Auth)
- **ORM**: Drizzle ORM

## Exporting Your Data

### Step 1: Export Database Schema

```bash
# From your Replit terminal
npm run db:push
pg_dump $DATABASE_URL --schema-only > schema.sql
```

### Step 2: Export Database Data

```bash
pg_dump $DATABASE_URL --data-only > data.sql
```

### Step 3: Full Database Backup

```bash
pg_dump $DATABASE_URL > full_backup.sql
```

---

## Database Migration

### Option 1: PostgreSQL on Another Platform

Popular PostgreSQL providers:
- **Neon** (neon.tech) - Free tier: 0.5GB, serverless
- **Supabase** (supabase.com) - Free tier: 500MB
- **ElephantSQL** (elephantsql.com) - Free tier: 20MB
- **AWS RDS PostgreSQL** - Paid, highly scalable
- **Google Cloud SQL** - Paid, Google Cloud Platform
- **Azure Database for PostgreSQL** - Paid, Microsoft Azure

**Migration Steps:**

1. **Create new PostgreSQL database** on your chosen provider
2. **Get connection string** (usually in format: `postgresql://user:password@host:port/database`)
3. **Import your schema:**
   ```bash
   psql <NEW_DATABASE_URL> < schema.sql
   ```
4. **Import your data:**
   ```bash
   psql <NEW_DATABASE_URL> < data.sql
   ```
5. **Verify migration:**
   ```bash
   psql <NEW_DATABASE_URL>
   \dt  # List all tables
   SELECT COUNT(*) FROM users;  # Check data
   ```

### Option 2: Using Drizzle Migrations

If you prefer using Drizzle ORM migrations:

1. Update `DATABASE_URL` in `.env` to your new database
2. Run:
   ```bash
   npm run db:push
   ```

This will sync your schema to the new database.

---

## Application Migration

### Step 1: Download Your Code

From Replit:
```bash
git clone <your-replit-git-url>
# Or download as ZIP from Replit
```

### Step 2: Prepare for Deployment

#### Update Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=your-db-name

# Session
SESSION_SECRET=your-random-secret-key-here

# Authentication (if keeping Replit Auth)
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id

# Node
NODE_ENV=production
```

#### Generate Session Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Build the Application

```bash
npm install
npm run build
```

This creates:
- `dist/` - Built frontend files
- Compiled backend code

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | `<random-64-char-string>` |
| `NODE_ENV` | Environment mode | `production` |

### Optional Variables (for Auth)

| Variable | Description | Default |
|----------|-------------|---------|
| `ISSUER_URL` | OIDC issuer URL | `https://replit.com/oidc` |
| `REPL_ID` | Replit application ID | - |
| `PORT` | Server port | `5000` |

---

## Deployment Options

### Option 1: Traditional VPS (Hostinger, DigitalOcean, etc.)

**Requirements:**
- Ubuntu/Debian server
- Node.js 20+
- PostgreSQL
- Nginx (for reverse proxy)

**Steps:**

1. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

3. **Upload your code** (via Git or SCP)

4. **Install dependencies:**
   ```bash
   cd your-app
   npm install --production
   npm run build
   ```

5. **Set up environment:**
   ```bash
   nano .env
   # Add all environment variables
   ```

6. **Start with PM2:**
   ```bash
   pm2 start dist/server/index.js --name "crm-app"
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option 2: Vercel (Serverless)

**Note:** Requires separating frontend and backend

1. **Frontend on Vercel:**
   - Push code to GitHub
   - Import project to Vercel
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Backend on separate service** (Railway, Render, etc.)

### Option 3: Netlify + Backend Service

Similar to Vercel - deploy frontend on Netlify, backend elsewhere.

### Option 4: Railway

**Pros:**
- Easy deployment
- Built-in PostgreSQL
- Free tier available

**Steps:**

1. Connect GitHub repository to Railway
2. Add PostgreSQL database (Railway provides)
3. Add environment variables in Railway dashboard
4. Deploy automatically

### Option 5: Render

**Pros:**
- Free tier for web services
- Built-in PostgreSQL
- Easy setup

**Steps:**

1. Create new Web Service on Render
2. Connect GitHub repository
3. Build command: `npm install && npm run build`
4. Start command: `node dist/server/index.js`
5. Add PostgreSQL database (Render provides)
6. Add environment variables

---

## Common Platforms

### Hostinger Shared Hosting

**Limitations:**
- Shared hosting typically only supports PHP/MySQL
- Node.js support limited or unavailable
- **Not recommended for this application**

**Alternative:** Use Hostinger VPS instead

### Hostinger VPS

**Steps:**

1. Order VPS plan
2. SSH into server
3. Follow "Traditional VPS" steps above
4. Point your domain to VPS IP

### Spaceship (Domain + Hosting)

**Note:** Spaceship is primarily a domain registrar. For hosting:

1. Buy domain on Spaceship
2. Host application elsewhere (VPS, Railway, Render)
3. Update DNS settings on Spaceship to point to your hosting

**DNS Configuration Example:**
```
Type: A
Name: @
Value: <your-server-ip>

Type: CNAME
Name: www
Value: yourdomain.com
```

---

## Authentication Migration

### If Replacing Replit Auth

You'll need to implement alternative authentication:

**Option 1: Auth0**
- Create Auth0 account
- Configure application
- Replace `server/replitAuth.ts` with Auth0 implementation

**Option 2: NextAuth.js**
- Add next-auth package
- Configure providers (Google, email, etc.)

**Option 3: Passport.js Local Strategy**
- Implement username/password authentication
- Add password hashing (bcrypt)
- Create login/register endpoints

### If Keeping Replit Auth

Replit Auth can work on other platforms:
- Keep `ISSUER_URL` and `REPL_ID`
- Ensure callback URLs are updated in Replit settings

---

## File Storage

If you add file uploads (logos, signatures), you'll need:

**Option 1: Local Storage (VPS only)**
```javascript
// Store in /uploads directory
const uploadDir = './uploads';
```

**Option 2: Cloud Storage (Recommended)**
- **AWS S3** - Most popular, pay-as-you-go
- **Cloudinary** - Free tier: 25GB storage
- **Backblaze B2** - Cheaper than S3
- **DigitalOcean Spaces** - S3-compatible

---

## Performance Optimization

### Production Build

Ensure you build for production:
```bash
NODE_ENV=production npm run build
```

### Enable Compression

Add to your Express server:
```javascript
import compression from 'compression';
app.use(compression());
```

### Cache Static Assets

Configure Nginx caching for static files.

---

## Monitoring & Logs

### PM2 Logs

```bash
pm2 logs crm-app
pm2 monit
```

### Error Tracking

Consider adding:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Full monitoring

---

## Backup Strategy

### Automated Database Backups

```bash
# Cron job for daily backups
0 2 * * * pg_dump $DATABASE_URL > /backups/crm_$(date +\%Y\%m\%d).sql
```

### S3 Backup Script

```bash
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://your-bucket/backup-$(date +\%Y\%m\%d).sql.gz
```

---

## Cost Estimates (200 Users)

### Database Options

- **Neon Free**: 0.5GB - May be insufficient
- **Neon Pro**: $19/month - 10GB storage
- **Supabase Pro**: $25/month - 8GB storage
- **AWS RDS**: ~$30-50/month
- **Self-hosted PostgreSQL on VPS**: Free (included in VPS cost)

### Hosting Options

- **Railway**: $5-20/month (usage-based)
- **Render**: $7-25/month
- **DigitalOcean VPS**: $12-24/month
- **Hostinger VPS**: £4-20/month
- **AWS/Google Cloud**: Variable, $30-100/month

### Total Monthly Cost Estimate

- **Budget**: £15-30/month (Railway/Render + Neon)
- **Recommended**: £30-50/month (VPS + managed DB)
- **Enterprise**: £100+/month (AWS/GCP full setup)

---

## Support & Troubleshooting

### Common Issues

**Database Connection Errors:**
- Check connection string format
- Verify SSL settings (add `?sslmode=require` if needed)
- Check firewall rules

**Build Errors:**
- Run `npm install` again
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)

**Session Issues:**
- Verify SESSION_SECRET is set
- Check session table exists in database

---

## Final Checklist

Before going live:

- [ ] Database migrated and verified
- [ ] All environment variables set
- [ ] Application builds successfully
- [ ] Authentication working
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] Backup system in place
- [ ] Monitoring configured
- [ ] Test all features thoroughly

---

## Conclusion

Your CRM application is portable and can run on many platforms. Choose based on:
- Your technical skill level
- Budget constraints
- Expected traffic/usage
- Desired control vs convenience

For 200 users at £20/month (£4,000/month revenue), investing £30-50/month in reliable hosting is recommended for best performance and support.

---

**Need Help?**

If you encounter issues during migration, most hosting providers offer:
- Documentation and tutorials
- Support tickets
- Community forums

Good luck with your migration!
