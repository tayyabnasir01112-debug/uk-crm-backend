# UK Small Business CRM

A comprehensive CRM platform designed specifically for small businesses in the UK, featuring quotations, invoices, delivery challans, inventory management, and HR modules.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon, Supabase, or local)
- Git

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection string

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## 📦 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Authentication**: Local email/password (bcrypt)
- **UI**: Radix UI + Tailwind CSS

## 🌐 Deployment

### Free Hosting Setup

This application is configured for free hosting on:
- **Frontend**: Netlify (free)
- **Backend**: Render (free)
- **Database**: Neon (free tier: 0.5GB)

See `DEPLOYMENT_STEPS.md` for complete deployment instructions.

## 📚 Documentation

- `DEPLOYMENT_STEPS.md` - Step-by-step deployment guide
- `NETLIFY_DEPLOYMENT.md` - Detailed Netlify deployment
- `FREE_NETLIFY_DATABASE.md` - Free database options
- `FREE_SETUP_SUMMARY.md` - Quick reference
- `MIGRATION_GUIDE.md` - Migration from other platforms

## 🔧 Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Random secret for session encryption

### Optional

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS (production)
- `VITE_API_URL` - Backend API URL (frontend)

## 📝 Features

- ✅ User authentication (email/password)
- ✅ Business onboarding
- ✅ Customer management
- ✅ Inventory management
- ✅ Quotations
- ✅ Invoices
- ✅ Delivery challans
- ✅ Employee management
- ✅ Reports and analytics

## 🤝 Contributing

This is a private project. For issues or questions, please contact the maintainer.

## 📄 License

MIT

