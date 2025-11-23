# Google Search Console Setup Guide

## Issue: Continue Button Not Enabling

When adding your domain to Google Search Console, the **Continue** button won't enable if you enter the domain incorrectly.

### ✅ Correct Format for Domain Property Type

For **Domain** property type, enter **ONLY** the domain name:
```
crmlaunch.co.uk
```

**Do NOT include:**
- ❌ `https://` or `http://`
- ❌ `www.` prefix
- ❌ Trailing slash `/`
- ❌ Any path

### ❌ Wrong Formats (Will Not Work)
- `https://crmlaunch.co.uk/` ❌
- `https://crmlaunch.co.uk` ❌
- `www.crmlaunch.co.uk` ❌
- `crmlaunch.co.uk/` ❌

### ✅ Correct Format
- `crmlaunch.co.uk` ✅

## Step-by-Step Instructions

1. **Go to Google Search Console**: https://search.google.com/search-console

2. **Click "Add Property"** (top left)

3. **Select "Domain" property type** (left option)

4. **Enter domain**: Type `crmlaunch.co.uk` (without https:// or www.)

5. **Click "Continue"** - The button should now be enabled

6. **DNS Verification**:
   - Google will provide you with a TXT record to add to your DNS
   - Go to Spaceship DNS settings
   - Add a TXT record:
     - **Type**: TXT
     - **Name**: @ (or leave blank for root domain)
     - **Value**: (The TXT record value provided by Google)
     - **TTL**: 3600

7. **Verify Ownership**:
   - After adding the TXT record, wait 5-10 minutes for DNS propagation
   - Click "Verify" in Google Search Console
   - If it fails, wait a bit longer and try again (DNS can take up to 48 hours)

## After Verification

1. **Submit Sitemap**:
   - Go to "Sitemaps" in the left sidebar
   - Enter: `sitemap.xml`
   - Click "Submit"

2. **Request Indexing** (Optional but recommended):
   - Go to "URL Inspection" tool
   - Enter your homepage: `https://crmlaunch.co.uk/`
   - Click "Request Indexing"
   - Repeat for key pages:
     - `https://crmlaunch.co.uk/about`
     - `https://crmlaunch.co.uk/contact`
     - `https://crmlaunch.co.uk/faq`

## Alternative: URL Prefix Property Type

If you prefer to use "URL prefix" instead:

1. Select **"URL prefix"** (right option)
2. Enter: `https://crmlaunch.co.uk`
3. For verification, you can use:
   - HTML file upload
   - HTML tag
   - Google Analytics
   - Google Tag Manager

## Troubleshooting

**Problem**: Continue button still not enabling
- **Solution**: Make sure you're entering ONLY `crmlaunch.co.uk` with no protocol, no www, no trailing slash

**Problem**: DNS verification failing
- **Solution**: 
  - Wait 10-30 minutes after adding TXT record
  - Check DNS propagation: https://dnschecker.org
  - Make sure TXT record is at root domain (@) not subdomain

**Problem**: Sitemap not found
- **Solution**: 
  - Verify sitemap is accessible: https://crmlaunch.co.uk/sitemap.xml
  - Make sure it's submitted as `sitemap.xml` (not full URL)

## Quick Checklist

- [ ] Domain entered as `crmlaunch.co.uk` (no https://, no www, no trailing slash)
- [ ] Continue button is enabled
- [ ] TXT record added to Spaceship DNS
- [ ] DNS propagated (check with dnschecker.org)
- [ ] Domain verified in Google Search Console
- [ ] Sitemap submitted: `sitemap.xml`
- [ ] Key pages requested for indexing

