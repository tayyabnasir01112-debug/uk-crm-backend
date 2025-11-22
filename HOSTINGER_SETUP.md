# Hostinger VPS Setup Guide - UK Small Business CRM

## Important Note

**Hostinger Shared Hosting does NOT support Node.js applications.**

Your CRM is built with Node.js/Express, so you have two options:

### Option 1: Hostinger VPS (Recommended)
- Full control, supports Node.js
- Can run PostgreSQL on the same server (free)
- More cost-effective for your use case

### Option 2: Hostinger Domain + External Hosting
- Buy domain from Hostinger
- Host application on Render/Railway (free or cheap)
- Use external database

---

## Option 1: Hostinger VPS Setup (Recommended)

### Hostinger VPS Plans for 100-150 Users

| Plan | Price/Month | RAM | Storage | CPU | Best For |
|------|-------------|-----|---------|-----|----------|
| **VPS 1** | ~£4-6/month | 1 GB | 20 GB | 1 vCPU | Small start |
| **VPS 2** | ~£7-9/month | 2 GB | 40 GB | 2 vCPU | **Recommended** |
| **VPS 3** | ~£12-15/month | 4 GB | 80 GB | 4 vCPU | Growth phase |

**For 100-150 users, VPS 2 is recommended.**

### Database Options on Hostinger VPS

#### Option A: PostgreSQL on Same VPS (FREE - Recommended)

**Pros:**
- ✅ **Completely free** (included with VPS)
- ✅ No additional costs
- ✅ Full control
- ✅ Low latency (same server)
- ✅ Easy backups

**Cons:**
- ⚠️ Uses VPS resources (RAM/CPU)
- ⚠️ You manage backups
- ⚠️ No automatic scaling

**Storage Estimate for 100-150 Users:**
- User data: ~50-100 MB
- Business data: ~200-500 MB
- Invoices/Quotations: ~500 MB - 2 GB
- **Total: ~1-3 GB** (well within VPS storage)

**Setup:**
```bash
# Install PostgreSQL on Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE ukcrm;
CREATE USER ukcrm_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE ukcrm TO ukcrm_user;
```

**Cost: £0/month** (included with VPS)

---

#### Option B: Managed PostgreSQL Services (External)

If you prefer managed databases, here are cheap options:

### 1. Neon (Free Tier)
- **Free**: 0.5GB storage
- **Pro**: $19/month for 10GB
- **Best for**: Starting out, then upgrade when needed

### 2. Supabase (Free Tier)
- **Free**: 500MB storage, 2GB bandwidth
- **Pro**: $25/month for 8GB storage
- **Best for**: If you want additional features

### 3. Railway PostgreSQL
- **Free**: $5 credit/month (usually enough for small DB)
- **Paid**: ~$5-10/month for small databases
- **Best for**: Simple managed solution

### 4. DigitalOcean Managed Database
- **Basic**: $15/month for 1GB RAM, 10GB storage
- **Best for**: Reliability and performance

**Recommendation for 100-150 users:**
- **Start**: PostgreSQL on VPS (free)
- **If you grow**: Consider Neon Pro ($19/month) or DigitalOcean ($15/month)

---

## Complete Cost Breakdown (Hostinger VPS)

### Scenario 1: Everything on VPS (Cheapest)

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Hostinger VPS** | VPS 2 | £7-9/month |
| **PostgreSQL** | On VPS | **FREE** |
| **Domain** | .com/.co.uk | ~£10-15/year |
| **SSL** | Let's Encrypt | **FREE** |
| **Total** | | **£7-9/month** |

### Scenario 2: VPS + Managed Database

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| **Hostinger VPS** | VPS 2 | £7-9/month |
| **Neon Pro** | 10GB | $19/month (~£15) |
| **Domain** | .com/.co.uk | ~£10-15/year |
| **SSL** | Let's Encrypt | **FREE** |
| **Total** | | **£22-24/month** |

---

## Step-by-Step Setup Guide

### Step 1: Purchase Hostinger VPS

1. Go to [hostinger.com](https://www.hostinger.com)
2. Choose **VPS Hosting** → **VPS 2** (recommended)
3. Select Ubuntu 22.04 LTS
4. Complete purchase
5. Note your VPS IP address and root password

### Step 2: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 3: Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx (for reverse proxy)
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### Step 4: Set Up PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE ukcrm;
CREATE USER ukcrm_user WITH PASSWORD 'your-strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE ukcrm TO ukcrm_user;
\q

# Configure PostgreSQL to allow connections
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add line: host    ukcrm    ukcrm_user    0.0.0.0/0    md5

sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = '*'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 5: Upload Your Code

```bash
# Install Git
apt install -y git

# Clone your repository (or upload via SCP)
cd /var/www
git clone https://github.com/yourusername/your-repo.git ukcrm
cd ukcrm

# Install dependencies
npm install

# Create .env file
nano .env
```

**Add to .env:**
```env
DATABASE_URL=postgresql://ukcrm_user:your-password@localhost:5432/ukcrm
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
PORT=5000
```

### Step 6: Run Database Migrations

```bash
npm run db:push
```

### Step 7: Build and Start Application

```bash
# Build the application
npm run build

# Start with PM2
pm2 start dist/index.js --name "ukcrm"
pm2 save
pm2 startup
```

### Step 8: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/ukcrm
```

**Add configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ukcrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9: Set Up SSL with Let's Encrypt (Free)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

### Step 10: Configure Firewall

```bash
# Install UFW
apt install -y ufw

# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

---

## Option 2: Hostinger Domain + External Hosting

If you prefer not to manage a VPS:

### Setup:
1. **Buy domain from Hostinger**: ~£10-15/year
2. **Host backend on Render**: Free tier (or $7/month for always-on)
3. **Host frontend on Netlify**: Free
4. **Use Neon database**: Free tier (or $19/month for 10GB)

**Total Cost: £0-26/month** (depending on upgrades)

---

## Database Size Estimates for 100-150 Users

### Per User Data:
- User profile: ~1 KB
- Business profile: ~5 KB
- Customers: ~2 KB each (avg 10 per user = 20 KB)
- Inventory items: ~1 KB each (avg 20 per user = 20 KB)
- Invoices: ~5 KB each (avg 50 per user = 250 KB)
- Quotations: ~5 KB each (avg 30 per user = 150 KB)
- Employees: ~2 KB each (avg 5 per user = 10 KB)

**Per user total: ~456 KB**

### Total for 150 Users:
- **150 users × 456 KB = ~68 MB**
- **With overhead and growth: ~200-500 MB**
- **With file uploads (logos, signatures): ~1-2 GB**

**Conclusion**: PostgreSQL on VPS (20-40 GB storage) is more than enough!

---

## Backup Strategy

### Automated PostgreSQL Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump ukcrm | gzip > $BACKUP_DIR/ukcrm_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ukcrm_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

---

## Monitoring & Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs ukcrm
```

### Check Database
```bash
sudo -u postgres psql ukcrm
# Then: \dt (list tables), \q (quit)
```

### Check Disk Space
```bash
df -h
```

### Check Memory Usage
```bash
free -h
```

---

## Cost Comparison Summary

| Setup | Monthly Cost | Best For |
|-------|--------------|----------|
| **VPS + PostgreSQL on VPS** | £7-9/month | **Best value, full control** |
| **VPS + Neon Pro** | £22-24/month | Managed database, less maintenance |
| **Hostinger Domain + Render + Neon** | £0-26/month | No server management |

---

## Recommendation for 100-150 Users

**Best Option: Hostinger VPS 2 + PostgreSQL on VPS**

**Why:**
- ✅ **Cheapest**: Only £7-9/month
- ✅ **Sufficient resources**: 2GB RAM, 40GB storage
- ✅ **Free database**: PostgreSQL included
- ✅ **Full control**: You manage everything
- ✅ **Scalable**: Can upgrade VPS when needed
- ✅ **Performance**: Everything on same server = low latency

**When to Consider Managed Database:**
- If you exceed 5GB database size
- If you want automatic backups and scaling
- If you prefer not to manage database

---

## Next Steps

1. **Purchase Hostinger VPS 2** (~£7-9/month)
2. **Follow Step-by-Step Setup Guide** above
3. **Point your domain** to VPS IP address
4. **Test your application**
5. **Set up automated backups**

**Total setup time: 2-3 hours**

---

## Support Resources

- **Hostinger Support**: 24/7 live chat
- **PostgreSQL Docs**: [postgresql.org/docs](https://www.postgresql.org/docs/)
- **PM2 Docs**: [pm2.keymetrics.io](https://pm2.keymetrics.io/)
- **Nginx Docs**: [nginx.org/en/docs](https://nginx.org/en/docs/)

---

**Your CRM will be running on a dedicated VPS for just £7-9/month!** 🚀

