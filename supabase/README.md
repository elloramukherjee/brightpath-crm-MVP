# Supabase Database Migrations for BrightPath CRM

Follow these steps to set up the database tables, triggers, and Row Level Security (RLS) policies in your Supabase project.

---

## Step 1: Open Supabase SQL Editor
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (e.g. `brightpath-crm`).
3. Click on the **SQL Editor** icon in the left navigation sidebar.
4. Click **New query**.

---

## Step 2: Run Initial Schema Migration
1. Copy the contents of [`supabase/migrations/001_initial_schema.sql`](file:///c:/Development/Be10x_BuildSideIncome/website/brightpath-crm/supabase/migrations/001_initial_schema.sql).
2. Paste into the SQL Editor and click **Run**.
3. **Verified Result**: Tables `profiles`, `leads`, `follow_ups`, and `activities` are created with foreign keys, indexes, and automated triggers.

---

## Step 3: Run Row Level Security (RLS) Migration
1. Copy the contents of [`supabase/migrations/002_row_level_security.sql`](file:///c:/Development/Be10x_BuildSideIncome/website/brightpath-crm/supabase/migrations/002_row_level_security.sql).
2. Paste into the SQL Editor and click **Run**.
3. **Verified Result**: RLS is activated on all tables. Role policies ensure counsellors only access their assigned/created leads, while managers and admins have institute-wide access.

---

## Step 4: Bootstrap Initial Admin User
When you create your first account in BrightPath CRM via the app or Supabase Auth, the user will default to `counsellor`. To promote your account to `admin`:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

---

## Step 5: (Optional) Insert Demo Seed Data
1. Copy the contents of [`supabase/migrations/003_demo_seed.sql`](file:///c:/Development/Be10x_BuildSideIncome/website/brightpath-crm/supabase/migrations/003_demo_seed.sql).
2. Paste into the SQL Editor and click **Run**.
3. **Verified Result**: Fictional leads, follow-ups (including 1 overdue item), and activity timeline entries are populated for testing.
