-- ==============================================================================
-- BRIGHTPATH CRM — ALL-IN-ONE DATABASE SETUP & SEED SCRIPT
-- ==============================================================================
-- Run this in your Supabase project (opslopzhwgqtsmtpurdf):
-- https://supabase.com/dashboard/project/opslopzhwgqtsmtpurdf/sql

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'counsellor' CHECK (role IN ('admin', 'manager', 'counsellor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    course_interest TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('Website', 'Call', 'Walk-in', 'Referral', 'Social Media', 'Other')),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost')),
    lost_reason TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Follow-ups Table
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ NOT NULL,
    note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Activities Table (Audit History Log)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'status_changed', 'note_added', 'follow_up_created', 'follow_up_completed')),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_due_status ON public.follow_ups(due_at, status);
CREATE INDEX IF NOT EXISTS idx_followups_assigned_to ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- 7. Automated updated_at Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Automated Profile Creation Trigger for New Auth Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'counsellor'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Row Level Security Activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 10. Role Helper Functions
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'counsellor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Profiles Policies
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;
CREATE POLICY "Users can update own profile name"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

-- 12. Leads Policies
DROP POLICY IF EXISTS "Users can view accessible leads" ON public.leads;
CREATE POLICY "Users can view accessible leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (
        public.is_manager_or_admin()
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
CREATE POLICY "Authenticated users can insert leads"
    ON public.leads FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "Users can update accessible leads" ON public.leads;
CREATE POLICY "Users can update accessible leads"
    ON public.leads FOR UPDATE
    TO authenticated
    USING (
        public.is_manager_or_admin()
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    )
    WITH CHECK (
        public.is_manager_or_admin()
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Managers and admins can delete leads" ON public.leads;
CREATE POLICY "Managers and admins can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (
        public.is_manager_or_admin()
    );

-- 13. Follow-ups Policies
DROP POLICY IF EXISTS "Users can view follow-ups for accessible leads" ON public.follow_ups;
CREATE POLICY "Users can view follow-ups for accessible leads"
    ON public.follow_ups FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = follow_ups.lead_id
            AND (
                public.is_manager_or_admin()
                OR l.assigned_to = auth.uid()
                OR l.created_by = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can create follow-ups for accessible leads" ON public.follow_ups;
CREATE POLICY "Users can create follow-ups for accessible leads"
    ON public.follow_ups FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = follow_ups.lead_id
            AND (
                public.is_manager_or_admin()
                OR l.assigned_to = auth.uid()
                OR l.created_by = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can update follow-ups for accessible leads" ON public.follow_ups;
CREATE POLICY "Users can update follow-ups for accessible leads"
    ON public.follow_ups FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = follow_ups.lead_id
            AND (
                public.is_manager_or_admin()
                OR l.assigned_to = auth.uid()
                OR l.created_by = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Managers/admins can delete follow-ups" ON public.follow_ups;
CREATE POLICY "Managers/admins can delete follow-ups"
    ON public.follow_ups FOR DELETE
    TO authenticated
    USING (
        public.is_manager_or_admin()
    );

-- 14. Activities Policies
DROP POLICY IF EXISTS "Users can view activities for accessible leads" ON public.activities;
CREATE POLICY "Users can view activities for accessible leads"
    ON public.activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = activities.lead_id
            AND (
                public.is_manager_or_admin()
                OR l.assigned_to = auth.uid()
                OR l.created_by = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can insert activity logs for accessible leads" ON public.activities;
CREATE POLICY "Users can insert activity logs for accessible leads"
    ON public.activities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = activities.lead_id
            AND (
                public.is_manager_or_admin()
                OR l.assigned_to = auth.uid()
                OR l.created_by = auth.uid()
            )
        )
    );

-- 15. Demo Seed Data
DO $$
DECLARE
    first_profile_id UUID;
    lead_1_id UUID := gen_random_uuid();
    lead_2_id UUID := gen_random_uuid();
    lead_3_id UUID := gen_random_uuid();
    lead_4_id UUID := gen_random_uuid();
    lead_5_id UUID := gen_random_uuid();
BEGIN
    SELECT id INTO first_profile_id FROM public.profiles LIMIT 1;

    INSERT INTO public.leads (id, full_name, email, phone, course_interest, source, status, lost_reason, assigned_to, created_by, notes)
    VALUES
    (lead_1_id, 'Aarav Sharma', 'aarav.sharma@example.com', '+91 98765 43210', 'Full Stack Web Development', 'Website', 'New', NULL, first_profile_id, first_profile_id, 'Enquired via website contact form about upcoming weekend batch.'),
    (lead_2_id, 'Priya Patel', 'priya.patel@example.com', '+91 98123 45678', 'Data Science & AI Masterclass', 'Social Media', 'Contacted', NULL, first_profile_id, first_profile_id, 'Had introductory call. Requested detailed syllabus and fee structure.'),
    (lead_3_id, 'Rohan Verma', 'rohan.verma@example.com', '+91 97234 56789', 'Cloud DevOps Engineering', 'Referral', 'Qualified', NULL, first_profile_id, first_profile_id, 'Software engineer with 2 yrs experience looking to transition to DevOps.'),
    (lead_4_id, 'Sneha Iyer', 'sneha.iyer@example.com', '+91 96345 67890', 'UI/UX Design Bootcamp', 'Walk-in', 'Converted', NULL, first_profile_id, first_profile_id, 'Enrolled and paid registration deposit for October batch.'),
    (lead_5_id, 'Vikram Singh', 'vikram.singh@example.com', '+91 95456 78901', 'Full Stack Web Development', 'Call', 'Lost', 'Batch timings clash with current college schedule', first_profile_id, first_profile_id, 'Followed up twice. Timings did not suit.')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.follow_ups (lead_id, assigned_to, due_at, note, status, created_by)
    VALUES 
    (lead_1_id, first_profile_id, timezone('utc'::text, now()) - INTERVAL '1 day', 'Send course brochure and confirm demo class attendance.', 'pending', first_profile_id),
    (lead_2_id, first_profile_id, timezone('utc'::text, now()) + INTERVAL '1 day', 'Review fee discount options with student over phone.', 'pending', first_profile_id),
    (lead_4_id, first_profile_id, timezone('utc'::text, now()) - INTERVAL '3 days', 'Collect KYC documents and onboarding verification.', 'completed', first_profile_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.activities (lead_id, actor_id, activity_type, description, metadata)
    VALUES
    (lead_1_id, first_profile_id, 'created', 'Lead created from Website enquiry form', '{"source": "Website"}'::jsonb),
    (lead_2_id, first_profile_id, 'status_changed', 'Status changed from New to Contacted', '{"from": "New", "to": "Contacted"}'::jsonb),
    (lead_4_id, first_profile_id, 'status_changed', 'Status changed from Qualified to Converted (Enrolled)', '{"from": "Qualified", "to": "Converted"}'::jsonb),
    (lead_4_id, first_profile_id, 'follow_up_completed', 'Completed follow-up: Collect KYC documents and onboarding verification', '{}'::jsonb),
    (lead_5_id, first_profile_id, 'status_changed', 'Status changed to Lost. Reason: Batch timings clash with current college schedule', '{"reason": "Batch timings clash"}'::jsonb)
    ON CONFLICT DO NOTHING;
END $$;
