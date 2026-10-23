# BrightPath CRM — Admissions & Pipeline Management System

BrightPath CRM is a specialized, production-ready educational admissions CRM built for coaching institutes and academies. It tracks prospective student enquiries across web, call, messaging, and walk-in channels, schedules proactive follow-ups, calculates real-time conversion metrics, and enforces role-based access control.

---

## 🌟 Architecture & Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Vanilla CSS Design System with Plus Jakarta Sans & Inter typography, Navy/Slate SaaS palette
- **Routing**: `react-router-dom` (v7) with SPA rewrite configuration
- **Icons**: `lucide-react`
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth (`@supabase/supabase-js`)
- **Security**: PostgreSQL Row Level Security (RLS) with role separation (Admin, Manager, Counsellor)
- **Deployment**: Vercel Edge Hosting (Git CI/CD)

```
Browser (React + TS + Vite) 
    └── Typed Service Layer (src/services/)
          └── Supabase Client (src/lib/supabaseClient.ts)
                └── Supabase Cloud (PostgreSQL + RLS + Auth)
```

---

## 🚀 Key Modules & Features

1. **Admissions Dashboard**:
   - Live KPI cards: Total Accessible Leads, New Enquiries, Converted Students, Overdue Follow-ups, and Conversion Rate (`(Converted / Total) * 100` with division by zero guard).
   - Visual pipeline status distributions and acquisition source share meters.
   - Actionable upcoming follow-ups and recent enquiries feed.
2. **Student Leads Management**:
   - Complete CRUD persistence.
   - Lead lifecycle: `New` $\rightarrow$ `Contacted` $\rightarrow$ `Qualified` $\rightarrow$ `Converted` / `Lost`.
   - Mandatory Lost Reason capture when closing a lost enquiry.
   - Search across name, contact number, email, and course interest.
   - Multi-filtering by Status, Source, and Assigned Counsellor with 1-click filter reset.
3. **Follow-ups & Overdue Engine**:
   - Scheduled follow-up items with date/time, note, assignee, and status.
   - Strict Overdue calculation: `status = 'pending' AND due_at < NOW()`.
   - One-click "Mark Done" resolution with timestamp recording.
4. **Chronological Activity Timeline**:
   - Audit trail tracking lead creation, status transitions, follow-up scheduling, and completion.
5. **Analytics & Funnel Reports**:
   - Standardized admissions progression funnel.
   - Channel acquisition effectiveness table with enquiry share and channel-specific conversion rates.
6. **Authentication & Role Separation**:
   - Supabase Auth session management.
   - Role enforcement (Admin, Manager, Counsellor).
   - Client-side role tampering prevention via PostgreSQL triggers and RLS `WITH CHECK` clauses.

---

## 🛠️ Prerequisites & Setup

- **Node.js**: `v18+` (Tested on `v24.14.0`)
- **npm**: `v9+` (Tested on `11.8.0`)
- **Git**: Installed locally
- A free [Supabase](https://supabase.com) account

### Local Installation

1. **Clone or navigate to the repository**:
   ```bash
   cd brightpath-crm
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Supabase credentials:
   ```ini
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-public-client-key
   ```
   *(If unconfigured, the app gracefully launches in local demo prototype mode with sample data).*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🗄️ Database Setup (Supabase)

To link your live Supabase database, execute the SQL migration files located in `supabase/migrations/` using the **Supabase SQL Editor**:

1. **Initial Schema**: Run [`supabase/migrations/001_initial_schema.sql`](file:///c:/Development/Be10x_BuildSideIncome/website/brightpath-crm/supabase/migrations/001_initial_schema.sql).
   - Creates tables `profiles`, `leads`, `follow_ups`, `activities`.
   - Sets foreign keys, constraints, and automatic `updated_at` and new user triggers.
2. **Row Level Security**: Run [`supabase/migrations/002_row_level_security.sql`](file:///c:/Development/Be10x_BuildSideIncome/website/brightpath-crm/supabase/migrations/002_row_level_security.sql).
   - Enables RLS on all 4 tables.
   - Restricts counsellors to only view/edit leads they created or are assigned to.
   - Grants managers and admins institute-wide oversight.
3. **(Optional) Seed Demo Data**: Run [`supabase/migrations/003_demo_seed.sql`](file:///c:/Development/Be10x_BuildSideIncome/website/brightpath-crm/supabase/migrations/003_demo_seed.sql).
4. **Bootstrap Admin**:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@example.com');
   ```

---

## 🔒 Security & Production Considerations

1. **Secret Isolation**: Only public client keys (`VITE_SUPABASE_ANON_KEY`) are bundled into frontend code. Never store the `service_role` key in frontend code or Git.
2. **Database Invariants**: Constraints enforce valid lead statuses (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`) and sources at the PostgreSQL engine level.
3. **Self-Promotion Guard**: RLS policies prevent users from elevating their role via client requests.
4. **Production Readiness Checklist**:
   - [ ] Replace demo seed data with real student records.
   - [ ] Enable Email Confirmation in Supabase Auth Settings.
   - [ ] Set up regular automated PostgreSQL backups in Supabase Pro or enterprise settings.
   - [ ] Configure custom domain with DNS and SSL termination on Vercel.
