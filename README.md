# UK Small Business CRM

A CRM application for small businesses, with modules for customers, quotations, invoices, delivery challans, inventory, employees, and reporting.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Radix UI
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Drizzle ORM
- Authentication: Local email/password authentication with bcrypt

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Git

### Installation

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Edit `.env` before running the app. Never commit real credentials.

## Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Long random secret used for session encryption

Optional:

- `NODE_ENV` - `development` or `production`
- `PORT` - Server port, defaults to `5000`
- `FRONTEND_URL` - Allowed frontend origin for production CORS
- `VITE_API_URL` - Backend API URL used by the frontend

## Deployment

The app can be deployed with a hosted PostgreSQL provider plus a Node-compatible web host. Deployment guides in this repository use placeholders only. Add real values through your hosting provider's secret/environment-variable UI.

## Security

This repository must not contain real database URLs, session secrets, API keys, SMTP credentials, or deployment tokens. If a credential is ever committed, rotate it immediately even if the file is later edited.

See [SECURITY.md](SECURITY.md) for reporting and handling guidance.

## License

MIT
