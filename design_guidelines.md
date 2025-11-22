# CRM Platform Design Guidelines

## Design Approach: Fluent Design System with Business SaaS References

**Rationale:** This is a utility-focused, information-dense business productivity tool requiring efficiency, clarity, and stability. Using Fluent Design System as the foundation ensures professional business software patterns optimized for data-heavy workflows.

**Supporting References:**
- **Linear**: Clean data tables, crisp typography, efficient workflows
- **Notion**: Friendly onboarding, intuitive form patterns
- **Stripe Dashboard**: Clear subscription management, billing interfaces

**Core Principles:**
- Clarity over creativity: Users need to complete tasks quickly
- Scannable information hierarchy: Dense data presented digestibly  
- Consistency across modules: Learned patterns transfer between Invoice/HR/Inventory sections
- Professional without being corporate: Approachable for small business owners

---

## Typography

**Font Stack:** Inter (via Google Fonts CDN)
- **Headings:** 
  - H1: 2.5rem (40px), font-weight 700 - Dashboard headers, module titles
  - H2: 2rem (32px), font-weight 600 - Section headers
  - H3: 1.5rem (24px), font-weight 600 - Card titles, form section headers
  - H4: 1.25rem (20px), font-weight 600 - Subsection labels

- **Body Text:**
  - Large: 1.125rem (18px), font-weight 400 - Primary content, form labels
  - Base: 1rem (16px), font-weight 400 - Standard UI text, descriptions
  - Small: 0.875rem (14px), font-weight 400 - Helper text, table data
  - Tiny: 0.75rem (12px), font-weight 500 - Badges, metadata, timestamps

- **Special Cases:**
  - Buttons: 1rem (16px), font-weight 500
  - Navigation: 0.9375rem (15px), font-weight 500
  - Table Headers: 0.875rem (14px), font-weight 600, uppercase tracking-wide

---

## Layout System

**Container Strategy:**
- Max-width: `max-w-7xl` (1280px) for main content areas
- Dashboard sidebar: Fixed 240px width (w-60)
- Form containers: `max-w-3xl` (768px) for optimal readability

**Spacing Primitives** (Tailwind units):
Primary set: **2, 3, 4, 6, 8, 12, 16**
- Micro spacing (between elements): p-2, gap-3, space-y-4
- Component padding: p-4, p-6, p-8
- Section spacing: py-12, py-16
- Page margins: px-4 (mobile), px-6 (tablet), px-8 (desktop)

**Grid Patterns:**
- Dashboard cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Data tables: Full-width with horizontal scroll on mobile
- Forms: Single column on mobile, `grid-cols-2 gap-6` on desktop for related fields

---

## Component Library

### Navigation & Layout
**Top Navigation Bar:**
- Height: h-16 (64px)
- Business logo (left), navigation links (center), user profile dropdown (right)
- Sticky positioning for persistent access

**Sidebar (Dashboard):**
- Icons from Heroicons (outline for inactive, solid for active states)
- Module sections: Quotations, Invoices, Delivery Challans, Inventory, HR, Sales Reports, Settings
- Subscription status badge showing trial days or active subscription

**Breadcrumbs:**
- Above page headers for navigation context
- Text-sm with chevron separators

### Core UI Elements

**Buttons:**
- Primary: Solid background, medium roundedness (rounded-md)
- Secondary: Outlined with border
- Tertiary: Text-only for less important actions
- Sizes: Small (h-9 px-4), Medium (h-11 px-6), Large (h-13 px-8)

**Form Inputs:**
- Standard height: h-11 (44px) for text inputs, selects
- Border: 1px solid, rounded-md
- Focus state: Ring treatment (ring-2)
- Placeholder text: Helpful, specific examples ("e.g., Acme Plumbing Ltd")

**Cards:**
- Rounded corners: rounded-lg
- Shadow: Subtle elevation (shadow-sm), hover state (shadow-md)
- Padding: p-6 standard
- Used for: Dashboard statistics, document previews, settings sections

**Tables:**
- Striped rows for readability
- Sticky headers for long lists
- Row actions (edit, delete, download) in rightmost column
- Mobile: Convert to stacked cards

**Modals/Dialogs:**
- Centered overlay with backdrop blur
- Max-width: max-w-2xl for forms, max-w-4xl for document previews
- Close button (top-right), clear action buttons (bottom-right)

**Status Badges:**
- Pill shape (rounded-full), small text (text-xs)
- States: Active, Trial, Expired, Draft, Sent, Paid (for invoices)

**Document Preview Cards:**
- Thumbnail preview of PDF/document
- Actions: Download, Edit, View, Delete
- Metadata: Creation date, document number, status
- Grid layout: 2-3 columns on desktop

### Data Display

**Dashboard Statistics:**
- Large number display (text-3xl font-bold)
- Label below (text-sm)
- Icon to the left
- 4 cards in row on desktop: Total Revenue, Active Invoices, Inventory Items, Employees

**Charts (Sales Reporting):**
- Simple bar/line charts
- Clean axis labels, grid lines
- Legend positioned top-right
- Responsive breakpoints for mobile stacking

### Onboarding Flow

**Multi-Step Form:**
- Progress indicator (steps 1-5) at top
- Single section per step with clear heading
- Business Info → Logo Upload → Header/Footer → Signature → Payment Links
- "Auto-Generate Design" feature with preview panel
- Next/Previous buttons, Skip option where appropriate

**Auto-Generation Preview:**
- Split screen: Form inputs (left), Live preview (right)
- Preview shows letterhead with business name, address, auto-generated logo concept
- "Use This Design" or "Upload My Own" buttons

---

## Landing Page Strategy

**Layout Approach:** Classic SaaS landing page optimized for SEO and conversions

**Sections:**
1. **Hero Section** (100vh):
   - Headline: "Affordable CRM for UK Small Businesses"
   - Subheading: "Invoices, Quotes, Inventory & More - £20/month"
   - CTA: "Start 7-Day Free Trial" (primary button, large)
   - Trust indicator: "No credit card required • Cancel anytime"
   - Hero image: Dashboard screenshot showing clean interface

2. **Feature Grid** (3 columns desktop):
   - Icons from Heroicons
   - 6 feature cards: Quotations, Invoices, Delivery Challans, Inventory, HR Module, Sales Reports
   - Brief description for each

3. **Benefits Section** (alternating 2-column):
   - "Save Time" - Auto-generate professional documents
   - "Look Professional" - Custom branding, logos, signatures
   - "Stay Organized" - All business data in one place
   - Each with supporting illustration/screenshot

4. **Pricing Section:**
   - Single plan card (centered): £20/month
   - Feature checklist
   - 7-day free trial highlight
   - CTA button

5. **Social Proof** (if available):
   - Testimonials or usage statistics
   - "Trusted by 200+ UK small businesses"

6. **FAQ Section:**
   - Accordion-style questions about trial, cancellation, features
   - Addresses common objections

7. **Footer CTA:**
   - Repeat signup CTA
   - Footer navigation: Features, Pricing, Contact, Privacy Policy, Terms
   - Company info and copyright

**Vertical Rhythm:**
- Hero: min-h-screen
- Sections: py-20 (desktop), py-12 (mobile)
- Consistent max-w-7xl container

---

## Images

**Landing Page:**
- **Hero Background:** Modern, clean workspace photo showing small business environment (optional subtle overlay for text readability)
- **Hero Screenshot:** Dashboard interface preview showing CRM modules - centered or right-aligned
- **Feature Section Icons:** Use Heroicons for consistency
- **Benefits Section:** Alternating screenshots of actual product features:
  - Invoice generation interface
  - Auto-generated business logo preview
  - Inventory management table
  - Sales dashboard with charts

**Dashboard/Application:**
- **Empty States:** Friendly illustrations prompting first actions ("Create your first invoice")
- **Business Logo Placeholder:** Generic building/briefcase icon until user uploads/generates
- **Document Thumbnails:** Miniature previews of generated PDFs

**Style Guidelines:**
- Screenshots: Include subtle device frame (browser window mockup)
- All images: Optimized WebP format
- Maintain consistent visual style across all imagery