#!/bin/bash

# Deployment script for UK Small Business CRM
# This script helps you deploy to GitHub, Render, and Netlify

echo "🚀 UK Small Business CRM - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Generate session secret and create .env
echo -e "${YELLOW}Step 1: Setting up environment...${NC}"
node setup-env.js

# Step 2: Install dependencies
echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
npm install

# Step 3: Run database migrations
echo -e "\n${YELLOW}Step 3: Running database migrations...${NC}"
npm run db:push

# Step 4: Build the application
echo -e "\n${YELLOW}Step 4: Building application...${NC}"
npm run build

# Step 5: Git setup
echo -e "\n${YELLOW}Step 5: Setting up Git...${NC}"
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Git remote already configured"
else
    git remote add origin https://github.com/tayyabnasir01112-debug/uk-crm-backend.git
    echo "✅ Git remote added"
fi

# Step 6: Commit and push
echo -e "\n${YELLOW}Step 6: Committing and pushing to GitHub...${NC}"
git add .
git commit -m "Deploy UK Small Business CRM - $(date +%Y-%m-%d)" || echo "No changes to commit"
git branch -M main
git push -u origin main || echo "⚠️  Push failed. You may need to pull first or force push."

echo -e "\n${GREEN}✅ Local setup complete!${NC}"
echo ""
echo "📋 Next Steps:"
echo "1. Go to Render.com and create a new Web Service"
echo "2. Connect your GitHub repository: uk-crm-backend"
echo "3. Use the environment variables from .env file"
echo "4. Deploy to Netlify (see QUICK_DEPLOY.md)"
echo ""
echo "📄 See QUICK_DEPLOY.md for detailed deployment instructions"

