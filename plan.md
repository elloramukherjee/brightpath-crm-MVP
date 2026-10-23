# BrightPath CRM — Master Execution Plan & Project Context

> **Project Reference**: BrightPath CRM Admissions & Pipeline Management System  
> **Documentation Source**: `BrightPath_CRM_Full_Master_Build_Prompt.docx` (`BrightPath_CRM_Antigravity_Full_Build_Prompt.docx`)  
> **Stack**: React 19 + TypeScript + Vite | Supabase (PostgreSQL + Auth + RLS) | Git/GitHub | Vercel  
> **Development Model**: Single-Feature Iterative Lifecycle (`Develop` → `Test` → `Verify` → `Deploy` → `Live Test` → `Sign-off`)

---

## 🔄 The Single-Feature Lifecycle Protocol

Every feature in this project is developed, tested, verified, and deployed in isolation before proceeding to the next:

```
[1. Develop Feature] 
       │
[2. Local Testing (UI + State)] 
       │
[3. Static Verification (tsc -b && vite build)] 
       │
[4. Deploy & Database Sync (Supabase SQL / Vercel Push)] 
       │
[5. Live URL Verification (Multi-role & Real DB)] 
       │
[6. Checkpoint & Sign-off] ──► Move to Next Feature Phase
```

---

## 📌 Phase-by-Phase Feature Breakdown

### Phase 1: Database Schema Foundation & Row Level Security (RLS)
- **Scope**:
  - PostgreSQL tables: `profiles`, `leads`, `follow_ups`, `activities`.
  - Column constraints: valid lead statuses (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`), valid sources (`Website`, `Call`, `Walk-in`, `Referral`, `Social Media`, `Other`), valid follow-up statuses (`pending`, `completed`, `cancelled`), valid roles (`admin`, `manager`, `counsellor`).
  - Foreign keys with `ON DELETE CASCADE` on `leads` for child tables (`follow_ups`, `activities`).
  - Automated triggers: `updated_at` timestamps on `profiles` and `leads`; `handle_new_user` on `auth.users` to provision profile.
  - Performance indexes on status, source, due date, and foreign keys.
  - Row Level Security (RLS) policies on all tables:
    - `profiles`: Authenticated read; self-update on name only; role modification strictly prohibited.
    - `leads`: Counsellors see only assigned/created leads; Managers/Admins see all leads.
    - `follow_ups` & `activities`: Accessible only if user has access to the parent lead.
- **Artifacts & Files**:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_row_level_security.sql`
  - `supabase/migrations/003_demo_seed.sql`
  - `supabase/README.md`
- **Quality Gate / Acceptance**:
  - Tables exist with RLS enabled; unauthorized queries return empty; new auth signups receive `counsellor` profile.

---

### Phase 2: Multi-User Authentication, Role Guards & Profile Provisioning
- **Scope**:
  - Supabase Auth integration (email/password sign-in and registration).
  - Global `AuthContext` and `useAuth` hook tracking `user`, `profile`, `session`, `isLoading`, and `userRole`.
  - `LoginPage` with tabbed interface for both **Sign In** and **Staff Registration**.
  - `ProtectedRoute` wrapper redirecting unauthenticated visitors to `/login`.
  - Header user menu with live role display and sign-out action.
  - Unconfigured credentials banner with non-intrusive demo fallback.
- **Artifacts & Files**:
  - `src/lib/supabaseClient.ts`
  - `src/services/authService.ts`
  - `src/context/AuthContext.tsx`
  - `src/components/auth/ProtectedRoute.tsx`
  - `src/pages/LoginPage.tsx`
- **Quality Gate / Acceptance**:
  - User can sign up, sign in, maintain session across reload, and log out cleanly.

---

### Phase 3: Lead Capture & Form Validation (Create, Read, Edit, Delete)
- **Scope**:
  - Student Lead data entity in `src/types/crm.types.ts`.
  - `LeadModal` for creating new student enquiries and editing existing leads.
  - Client-side validation:
    - Student full name (required, trimmed).
    - Phone number (required, minimum 8 digits).
    - Email address (optional, regex format validation if provided).
    - Course interest selection and Acquisition source selection.
    - Staff assignee selection (populated from `profiles`).
    - Notes / conversation background.
  - Lead deletion with browser confirmation dialog.
  - Real-time toast feedback notifications.
- **Artifacts & Files**:
  - `src/services/leadService.ts`
  - `src/components/leads/LeadModal.tsx`
  - `src/components/leads/LeadStatusBadge.tsx`
  - `src/pages/LeadsPage.tsx`
- **Quality Gate / Acceptance**:
  - Form blocks invalid/empty submissions with visible field errors.
  - Saved leads persist to Supabase `leads` table and reload on page refresh.

---

### Phase 4: Advanced Search, Multi-Criteria Filtering & Reset Engine
- **Scope**:
  - Universal search bar searching across: student full name, contact phone, email, and course interest.
  - Multi-dropdown filter bar:
    - Status filter (`New`, `Contacted`, `Qualified`, `Converted`, `Lost`).
    - Source filter (`Website`, `Call`, `Walk-in`, `Referral`, `Social Media`, `Other`).
    - Assignee filter (dynamically populated from active staff profiles).
  - "Reset Filters" action button that clears all active filters and keyword queries in one click.
  - Responsive table rendering with empty state message when no leads match criteria.
- **Artifacts & Files**:
  - `src/services/leadService.ts` (`getLeads` filter parameters)
  - `src/pages/LeadsPage.tsx`
- **Quality Gate / Acceptance**:
  - Search matches name, phone, email, and course substrings case-insensitively.
  - Combining multiple filters produces intersection results.
  - Reset button restores complete unfiltered list.

---

### Phase 5: Status Progression Lifecycle & Mandatory Lost Reason Protocol
- **Scope**:
  - Standard status progression: `New` → `Contacted` → `Qualified` → `Converted` / `Lost`.
  - Quick status dropdown selector directly within the leads table.
  - Status progression buttons on `LeadDetailPage`.
  - **Mandatory Lost Reason Protocol**:
    - When moving to `Lost`, `LeadStatusModal` opens requiring selection of a primary reason or custom explanation.
    - Status cannot be changed to `Lost` without a reason.
  - Reason displayed on lead card, detail header, and activity log.
- **Artifacts & Files**:
  - `src/components/leads/LeadStatusModal.tsx`
  - `src/pages/LeadDetailPage.tsx`
- **Quality Gate / Acceptance**:
  - Cannot mark lead as `Lost` without specifying a reason.
  - `lost_reason` is saved to database and rendered in UI badges.

---

### Phase 6: Follow-up Scheduler, Due Date Engine & Overdue Detection
- **Scope**:
  - `FollowUpModal` to schedule follow-up touchpoints against any student lead with:
    - Date and time picker (`due_at`).
    - Action agenda / note.
    - Staff assignee dropdown.
  - Dedicated `FollowUpsPage`:
    - Metric counters: **Overdue Follow-ups**, **Upcoming / Pending**, and **Completed**.
    - Tabbed filtering: All, Overdue, Upcoming, Completed.
  - **Strict Overdue Calculation Rule**:
    - An item is Overdue IF and ONLY IF: `status = 'pending' AND due_at < NOW()`.
  - 1-Click "Mark Complete" action button setting `status = 'completed'` and recording `completed_at` timestamp.
  - Completed follow-ups immediately removed from overdue count.
- **Artifacts & Files**:
  - `src/services/followUpService.ts`
  - `src/components/followups/FollowUpModal.tsx`
  - `src/pages/FollowUpsPage.tsx`
- **Quality Gate / Acceptance**:
  - Overdue logic strictly matches `due_at < NOW()`.
  - Marking complete records `completed_at` timestamp and removes overdue state.

---

### Phase 7: Chronological Activity Audit Trail & Event Logger
- **Scope**:
  - Automatic event logging for student lead actions:
    - `created`: When a new enquiry is submitted.
    - `status_changed`: When status transitions (including old status, new status, and lost reason).
    - `follow_up_created`: When a follow-up is scheduled.
    - `follow_up_completed`: When a follow-up is marked done.
  - Chronological `ActivityTimeline` component displayed on `LeadDetailPage`:
    - Visual color-coded icons per activity type.
    - Formatted local timestamps.
    - Staff member attribution ("By: Full Name (role)").
- **Artifacts & Files**:
  - `src/services/activityService.ts`
  - `src/components/activity/ActivityTimeline.tsx`
  - `src/pages/LeadDetailPage.tsx`
- **Quality Gate / Acceptance**:
  - Every major lifecycle action generates an un-editable audit event in `activities` table.
  - Timeline displays in descending chronological order.

---

### Phase 8: Real-Time Reconciled Dashboard KPIs & Pipeline Visualizers
- **Scope**:
  - Real-time KPI summary cards:
    - **Total Leads**: Exact count of accessible leads.
    - **New Enquiries**: Leads with status `New`.
    - **Converted**: Enrolled students (`status = 'Converted'`).
    - **Overdue Follow-ups**: Pending follow-ups with `due_at < NOW()`.
    - **Conversion Rate**: `(Converted / Total) * 100` with division-by-zero safeguard (`0%` if total leads is 0).
  - Visual meter bars for **Pipeline by Status** (percentage share + count).
  - Visual meter bars for **Enquiries by Source** (percentage share + count).
  - Actionable **Upcoming Follow-ups** widget with inline "Done" button.
  - **Recent Enquiries** list with direct links to lead profiles.
  - Written metric definition labels on every card.
- **Artifacts & Files**:
  - `src/services/dashboardService.ts`
  - `src/pages/DashboardPage.tsx`
- **Quality Gate / Acceptance**:
  - Zero discrepancy between dashboard counters and list view records.
  - No hardcoded or fabricated statistics.

---

### Phase 9: Channel Attribution Analytics & Funnel Progression Reports
- **Scope**:
  - Standardized `ReportsPage`:
    - **Admissions Progression Funnel**: Enquiries tracked through stages (Stage 1: New → Stage 2: Contacted → Stage 3: Qualified → Stage 4: Converted).
    - **Acquisition Channel Effectiveness Table**:
      - Channel / Source Name (Website, Call, Walk-in, Referral, Social Media, Other).
      - Total Leads received.
      - Share of overall pipeline percentage.
      - Admissions confirmed (Converted count).
      - Channel-specific Conversion Rate percentage.
  - Strict reconciliation: identical metric definitions to Dashboard.
- **Artifacts & Files**:
  - `src/pages/ReportsPage.tsx`
- **Quality Gate / Acceptance**:
  - Reports table handles sources with 0 leads without division errors.
  - Totals match dashboard and lead list.

---

### Phase 10: Responsive Mobile UI Polish, Accessibility & Final Production Audit
- **Scope**:
  - Full mobile responsive audit:
    - Mobile sidebar drawer with toggle button, backdrop blur, and auto-close on link navigation.
    - Horizontal scrolling table containers preventing layout breaks on narrow screens (375px+).
    - Touch-friendly button sizes and form inputs.
  - Accessibility & UX:
    - Visual focus rings (`:focus-visible`).
    - Accessible color contrast for status badges (never relying on color alone).
    - Semantic HTML `<main>`, `<nav>`, `<header>`, `<table>`.
  - Production hygiene:
    - `vercel.json` SPA rewrite rules.
    - `.gitignore` audit (secrets and node_modules excluded).
    - Clean git commit history.
    - Comprehensive `README.md` and student handover documentation.
- **Artifacts & Files**:
  - `src/index.css`
  - `vercel.json`
  - `README.md`
- **Quality Gate / Acceptance**:
  - Production bundle compiles cleanly with 0 TypeScript and lint errors.
  - Mobile drawer opens and closes smoothly without horizontal page overflow.
  - Live URL functions end-to-end.

---

## 🚦 Execution Status Tracker

| Phase | Title | Dev Status | Test Status | Deployed Status | Live Verified |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Phase 1** | Database Schema & RLS Migrations | ✅ Complete | ✅ Complete | ✅ Complete (Live) | ✅ Verified (200 OK + RLS) |
| **Phase 2** | Multi-User Auth & Role Guards | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Auth |
| **Phase 3** | Lead Capture CRUD & Validation | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 4** | Advanced Search & Multi-Filters | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 5** | Status Lifecycle & Lost Reason | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 6** | Follow-up Scheduler & Overdue | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 7** | Chronological Activity Timeline | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 8** | Reconciled Dashboard & KPIs | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 9** | Attribution Analytics & Reports | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
| **Phase 10**| Mobile Polish & Vercel Handover | ✅ Complete | ✅ Complete | ⏳ Pending Vercel Push | ⏳ Pending Live Test |
