# CRM Launch - Business Management Platform

## Overview

CRM Launch is a micro-SaaS platform designed specifically for UK small businesses. It provides an all-in-one solution for managing quotations, invoices, delivery challans, inventory, and HR records. The platform is built as a full-stack web application with a focus on professional design, ease of use, and affordability (£20/month with a 7-day free trial).

**Target Users:** Small business owners in the UK who need professional document generation and basic business management tools without the complexity or cost of enterprise solutions.

**Core Value Proposition:** Simple, affordable, and professional business management with automated document generation and branding assistance for businesses without existing design assets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- **React 18** with TypeScript for type safety and developer experience
- **Vite** as the build tool and development server for fast HMR (Hot Module Replacement)
- **Wouter** for lightweight client-side routing
- **TanStack Query v5** for server state management, caching, and data synchronization

**UI Component Strategy:**
- **Radix UI** primitives for accessible, unstyled components
- **shadcn/ui** component patterns using the "New York" style variant
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Fluent Design System** influence for professional, business-focused aesthetics

**Design Philosophy:**
The design follows Fluent Design System principles with references to Linear (clean data tables), Notion (friendly onboarding), and Stripe Dashboard (clear subscription management). The approach prioritizes clarity over creativity, scannable information hierarchy, and consistency across modules. Typography uses Inter font with a carefully defined scale, and the color system supports light/dark modes with HSL-based custom properties.

### Backend Architecture

**Server Framework:**
- **Express.js** on Node.js for HTTP server and API routing
- Separate entry points for development (`index-dev.ts`) and production (`index-prod.ts`)
- Development mode integrates Vite middleware for HMR
- Production mode serves pre-built static assets

**API Design:**
- RESTful API endpoints under `/api/*` namespace
- Session-based authentication with middleware protection
- Request/response logging with performance monitoring
- JSON request body parsing with raw body preservation for webhooks

**Code Organization:**
- `server/routes.ts` - API endpoint definitions and route registration
- `server/storage.ts` - Data access layer with interface-based storage abstraction
- `server/app.ts` - Express application setup and middleware configuration
- `shared/schema.ts` - Shared type definitions and validation schemas using Drizzle ORM and Zod

### Authentication System

**OpenID Connect (OIDC) Integration:**
- Uses Replit's authentication service as the identity provider
- **Passport.js** with `openid-client` strategy for OIDC flow
- **Session management** via `express-session` with PostgreSQL-backed session store
- Sessions persist for 7 days with automatic renewal
- Token refresh mechanism to maintain valid access tokens

**Session Storage:**
- PostgreSQL table (`sessions`) stores serialized session data
- `connect-pg-simple` adapter bridges Express sessions with PostgreSQL
- Session data includes user claims, access tokens, and refresh tokens

**Authorization Pattern:**
- `isAuthenticated` middleware checks session validity before route access
- User identity (`req.user.claims.sub`) ties all data to authenticated users
- Automatic business profile and trial subscription creation on first login

### Data Storage

**Database:**
- **PostgreSQL** via Neon's serverless driver (`@neondatabase/serverless`)
- WebSocket-based connection pooling for serverless environments
- Database URL configured via `DATABASE_URL` environment variable

**ORM & Schema Management:**
- **Drizzle ORM** for type-safe database queries and migrations
- Schema defined in `shared/schema.ts` with TypeScript types auto-generated
- **Drizzle Kit** for schema migrations (`drizzle.config.ts`)
- **Zod** schemas derived from Drizzle tables for runtime validation

**Data Model:**
- `users` - User profiles from OIDC authentication
- `businesses` - Business information, branding, and onboarding state
- `subscriptions` - Subscription status, trial periods, payment tracking
- `customers` - Customer database for invoicing
- `quotations` - Sales quotations with line items
- `invoices` - Invoices with payment status tracking
- `deliveryChallans` - Delivery documents
- `inventoryItems` - Product/stock management
- `employees` - HR records

All user data is scoped by `userId` with CASCADE delete to maintain data integrity.

### Form Handling & Validation

**Client-Side:**
- **React Hook Form** for performant form state management
- **@hookform/resolvers** integrates Zod schemas with form validation
- Real-time validation with error messages
- Type-safe form data through Zod inference

**Server-Side:**
- Validation schemas from `shared/schema.ts` using `drizzle-zod`
- Insert/update schemas validate incoming request payloads
- Consistent validation rules between client and server

### State Management Strategy

**Server State:**
- TanStack Query manages all server data fetching and caching
- Query keys follow REST endpoint patterns (`["/api/business"]`)
- Optimistic updates and automatic refetching on mutations
- Error boundaries handle unauthorized (401) responses

**Client State:**
- React hooks (`useState`, `useEffect`) for local UI state
- Form state isolated to React Hook Form
- No global state management library needed due to server-state-first approach

### Build & Deployment

**Development Workflow:**
- `npm run dev` starts Vite dev server with Express backend
- Vite middleware serves React app with HMR
- API requests proxy through Express server
- TypeScript type checking via `npm run check`

**Production Build:**
- `npm run build` compiles both frontend and backend
- Vite bundles client code to `dist/public`
- esbuild bundles server code to `dist/index.js`
- `npm start` runs production server serving static files

**Environment Configuration:**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Session encryption key (required)
- `ISSUER_URL` - OIDC provider URL (defaults to Replit)
- `REPL_ID` - Replit-specific identifier for OIDC client
- `NODE_ENV` - Environment flag (development/production)

### File Upload & Asset Management

**Static Assets:**
- Company logos and signatures stored as uploaded files
- `attached_assets/` directory for static file storage
- Vite alias `@assets` resolves to attached_assets directory
- Business branding (colors, headers, footers) stored as database fields

**Future Enhancement Placeholder:**
Document generation (PDF) for quotations, invoices, and delivery challans is architecturally planned but not yet implemented. When added, it will use business branding data to generate professional documents.

## External Dependencies

### Third-Party UI Libraries
- **Radix UI** - Accessible component primitives (dialogs, dropdowns, accordions, etc.)
- **Lucide React** - Icon library
- **Recharts** - Chart components for reports and analytics
- **date-fns** - Date formatting and manipulation
- **class-variance-authority** & **clsx** - Conditional CSS class management

### Development Tools
- **TypeScript** - Type safety across frontend and backend
- **Tailwind CSS** with PostCSS - Utility-first styling
- **ESBuild** - Fast JavaScript bundling for production
- **Drizzle Kit** - Database schema migrations

### Backend Services
- **Replit Authentication** - OIDC identity provider (currently used)
- **Planned: Stripe** - Subscription billing (architecture prepared, not integrated)
- **Planned: PayPal** - Alternative payment method (architecture prepared, not integrated)

### Database & Connection
- **@neondatabase/serverless** - PostgreSQL driver optimized for serverless
- **ws** - WebSocket library for Neon's connection protocol
- **connect-pg-simple** - PostgreSQL session store adapter

### Hosting & Platform
- **Intended Deployment:** Netlify (free tier targeting 200 users)
- **Database:** Neon PostgreSQL (free tier compatible)
- **Current Environment:** Replit (development and initial deployment)

### SEO Considerations
The application includes comprehensive meta tags optimized for UK small business keywords ("cheap CRM UK", "small business CRM", "invoice software UK"). The landing page is designed to rank for affordability-focused search queries with clear value propositions.