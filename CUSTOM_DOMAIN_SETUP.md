# Custom Domain Setup for CRM Launch (crmlaunch.co.uk)

## What You Need from Spaceship

To connect your custom domain `crmlaunch.co.uk` to your Netlify site, you'll need the following DNS records from Spaceship:

### Required DNS Records:

1. **A Record** (for root domain):
   - **Type**: A
   - **Name**: @ (or leave blank for root domain)
   - **Value**: `75.2.60.5` (Netlify's IP address)
   - **TTL**: 3600 (or default)

2. **CNAME Record** (for www subdomain):
   - **Type**: CNAME
   - **Name**: www
   - **Value**: `uk-crm-frontend.netlify.app`
   - **TTL**: 3600 (or default)

### Alternative: CNAME for Root Domain (if A record doesn't work)

Some registrars don't support A records for root domains. If that's the case, use:

- **Type**: CNAME
- **Name**: @ (or leave blank)
- **Value**: `uk-crm-frontend.netlify.app`
- **TTL**: 3600

## Steps to Configure on Netlify:

1. **Log into Netlify Dashboard**:
   - Go to https://app.netlify.com
   - Select your site: `uk-crm-frontend`

2. **Add Custom Domain**:
   - Go to **Site settings** → **Domain management**
   - Click **Add custom domain**
   - Enter: `crmlaunch.co.uk`
   - Click **Verify**

3. **Add www Subdomain** (optional but recommended):
   - Click **Add domain alias**
   - Enter: `www.crmlaunch.co.uk`
   - Netlify will automatically set up redirects

4. **Configure DNS**:
   - Netlify will show you the DNS records you need to add
   - Follow the instructions above to add them in Spaceship

5. **SSL Certificate**:
   - Netlify will automatically provision a free SSL certificate via Let's Encrypt
   - This usually takes a few minutes to a few hours
   - Your site will be accessible via HTTPS automatically

## What to Send Me from Spaceship:

Once you've added the DNS records in Spaceship, please send me:

1. **Screenshot of your DNS records** showing:
   - The A record pointing to `75.2.60.5`
   - The CNAME record for www pointing to `uk-crm-frontend.netlify.app`

2. **DNS Configuration Details**:
   - Nameservers (if you're using Spaceship's nameservers)
   - Any other DNS records you have configured

## Verification Steps:

After DNS records are added:

1. **Check DNS Propagation**:
   - Use https://dnschecker.org to verify DNS propagation
   - Enter `crmlaunch.co.uk` and check if it resolves to Netlify's IP

2. **Test Domain**:
   - Once DNS propagates (usually 24-48 hours), visit `https://crmlaunch.co.uk`
   - The site should load with SSL certificate

3. **Update Sitemap**:
   - The sitemap.xml is already configured with `crmlaunch.co.uk`
   - Once the domain is live, submit it to Google Search Console

## Important Notes:

- **DNS Propagation**: Can take 24-48 hours to fully propagate worldwide
- **SSL Certificate**: Netlify automatically provisions SSL, usually within minutes
- **HTTPS Redirect**: Netlify automatically redirects HTTP to HTTPS
- **www Redirect**: Netlify can redirect www to non-www (or vice versa) - we'll configure this after domain is connected

## Next Steps After Domain is Live:

1. **Update Google Analytics** (if you have a measurement ID):
   - Replace `GA_MEASUREMENT_ID` in `client/index.html` with your actual Google Analytics ID

2. **Submit to Google Search Console**:
   - Add `https://crmlaunch.co.uk` as a property
   - Submit the sitemap: `https://crmlaunch.co.uk/sitemap.xml`
   - Request indexing for all pages

3. **Update Internal Links**:
   - All internal links already use relative paths, so they'll work automatically
   - The sitemap.xml is already configured with the new domain

4. **Verify SEO**:
   - Check that all pages are accessible
   - Verify meta tags are working
   - Test structured data with Google's Rich Results Test

## Current Status:

✅ Sitemap.xml configured with `crmlaunch.co.uk`
✅ Robots.txt configured
✅ All SEO pages created (About, Contact, Privacy, Terms, FAQ)
✅ Structured data (JSON-LD) added
✅ Google Analytics placeholder ready
✅ Meta tags optimized for UK market

## Support:

If you encounter any issues, contact me with:
- Screenshots of your DNS configuration
- Any error messages from Netlify
- DNS propagation check results

