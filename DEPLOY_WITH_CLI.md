# 🚀 Deploy Using CLI Tools

## Prerequisites

You'll need to install CLI tools and authenticate. I'll help you set this up.

---

## Step 1: Install Render CLI

Run this command:

```bash
npm install -g render-cli
```

Or use npx (no installation needed):

```bash
npx render-cli --version
```

---

## Step 2: Login to Render

```bash
render login
```

This will open a browser window for authentication.

---

## Step 3: Deploy to Render

```bash
# Navigate to project directory
cd C:\Users\ts199\Downloads\UKSmallBizCRM\UKSmallBizCRM

# Deploy using render.yaml
render deploy
```

**Note**: You'll still need to set environment variables in Render dashboard after deployment.

---

## Step 4: Install Netlify CLI

```bash
npm install -g netlify-cli
```

Or use npx:

```bash
npx netlify-cli --version
```

---

## Step 5: Login to Netlify

```bash
netlify login
```

This will open a browser window for authentication.

---

## Step 6: Deploy to Netlify

```bash
# Build first
npm run build

# Deploy
netlify deploy --prod --dir=dist/public
```

**Note**: You'll need to set VITE_API_URL environment variable in Netlify dashboard.

---

## Alternative: Manual is Easier!

The manual deployment (following the guides) is actually easier and faster:
- No CLI installation needed
- Visual interface
- Copy-paste values
- 15 minutes total

**Recommendation**: Follow `COMPLETE_DEPLOYMENT.md` - it's the easiest way!

---

## What I Can Help With

I can:
- ✅ Help install CLI tools
- ✅ Guide you through CLI commands
- ✅ Troubleshoot errors
- ✅ Verify each step

But I cannot:
- ❌ Log into your accounts
- ❌ Click buttons in web interfaces
- ❌ Access your authentication tokens

---

**Let me know if you want to use CLI or prefer the manual guides!** 🤔

