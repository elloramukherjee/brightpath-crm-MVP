-- ==============================================================================
-- BRIGHTPATH CRM — MIGRATION 002: ROW LEVEL SECURITY & POLICIES
-- ==============================================================================
-- Run this in the Supabase SQL Editor AFTER 001_initial_schema.sql

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to safely read current user's role
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

-- Helper to check if current user is manager or admin
CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. PROFILES POLICIES
-- Anyone authenticated can read staff profiles (needed for dropdown assignments)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile name" ON public.profiles;
CREATE POLICY "Users can update own profile name"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevents self-promotion
    );

-- 4. LEADS POLICIES
-- SELECT: Admins/Managers see all; Counsellors see created by or assigned to them
DROP POLICY IF EXISTS "Users can view accessible leads" ON public.leads;
CREATE POLICY "Users can view accessible leads"
    ON public.leads FOR SELECT
    TO authenticated
    USING (
        public.is_manager_or_admin()
        OR assigned_to = auth.uid()
        OR created_by = auth.uid()
    );

-- INSERT: Authenticated users can insert leads
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
CREATE POLICY "Authenticated users can insert leads"
    ON public.leads FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- UPDATE: Admins/Managers update any; Counsellors update only their assigned/created leads
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

-- DELETE: Only Admins and Managers can delete/archive leads
DROP POLICY IF EXISTS "Managers and admins can delete leads" ON public.leads;
CREATE POLICY "Managers and admins can delete leads"
    ON public.leads FOR DELETE
    TO authenticated
    USING (
        public.is_manager_or_admin()
    );

-- 5. FOLLOW-UPS POLICIES
-- Accessible if user has access to the parent lead
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

-- 6. ACTIVITIES POLICIES
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
