-- ==============================================================================
-- BRIGHTPATH CRM — MIGRATION 003: DEMO SEED DATA (OPTIONAL)
-- ==============================================================================
-- Run this in the Supabase SQL Editor AFTER 001 and 002.
-- Note: Replace the UUID below with your own auth.users id if you want to assign them to your test user,
-- or run as-is to populate fictional institute leads.

DO $$
DECLARE
    first_profile_id UUID;
    lead_1_id UUID := gen_random_uuid();
    lead_2_id UUID := gen_random_uuid();
    lead_3_id UUID := gen_random_uuid();
    lead_4_id UUID := gen_random_uuid();
    lead_5_id UUID := gen_random_uuid();
BEGIN
    -- Select the first available profile or leave NULL if no users have signed up yet
    SELECT id INTO first_profile_id FROM public.profiles LIMIT 1;

    -- Insert Sample Leads
    INSERT INTO public.leads (id, full_name, email, phone, course_interest, source, status, lost_reason, assigned_to, created_by, notes)
    VALUES
    (
        lead_1_id,
        'Aarav Sharma',
        'aarav.sharma@example.com',
        '+91 98765 43210',
        'Full Stack Web Development',
        'Website',
        'New',
        NULL,
        first_profile_id,
        first_profile_id,
        'Enquired via website contact form about upcoming weekend batch.'
    ),
    (
        lead_2_id,
        'Priya Patel',
        'priya.patel@example.com',
        '+91 98123 45678',
        'Data Science & AI Masterclass',
        'Social Media',
        'Contacted',
        NULL,
        first_profile_id,
        first_profile_id,
        'Had introductory call. Requested detailed syllabus and fee structure.'
    ),
    (
        lead_3_id,
        'Rohan Verma',
        'rohan.verma@example.com',
        '+91 97234 56789',
        'Cloud DevOps Engineering',
        'Referral',
        'Qualified',
        NULL,
        first_profile_id,
        first_profile_id,
        'Software engineer with 2 yrs experience looking to transition to DevOps.'
    ),
    (
        lead_4_id,
        'Sneha Iyer',
        'sneha.iyer@example.com',
        '+91 96345 67890',
        'UI/UX Design Bootcamp',
        'Walk-in',
        'Converted',
        NULL,
        first_profile_id,
        first_profile_id,
        'Enrolled and paid registration deposit for October batch.'
    ),
    (
        lead_5_id,
        'Vikram Singh',
        'vikram.singh@example.com',
        '+91 95456 78901',
        'Full Stack Web Development',
        'Call',
        'Lost',
        'Batch timings clash with current college schedule',
        first_profile_id,
        first_profile_id,
        'Followed up twice. Timings did not suit.'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert Sample Follow-ups
    -- 1 Overdue follow-up (due yesterday)
    INSERT INTO public.follow_ups (lead_id, assigned_to, due_at, note, status, created_by)
    VALUES (
        lead_1_id,
        first_profile_id,
        timezone('utc'::text, now()) - INTERVAL '1 day',
        'Send course brochure and confirm demo class attendance.',
        'pending',
        first_profile_id
    ) ON CONFLICT DO NOTHING;

    -- 1 Upcoming follow-up (due tomorrow)
    INSERT INTO public.follow_ups (lead_id, assigned_to, due_at, note, status, created_by)
    VALUES (
        lead_2_id,
        first_profile_id,
        timezone('utc'::text, now()) + INTERVAL '1 day',
        'Review fee discount options with student over phone.',
        'pending',
        first_profile_id
    ) ON CONFLICT DO NOTHING;

    -- 1 Completed follow-up
    INSERT INTO public.follow_ups (lead_id, assigned_to, due_at, note, status, completed_at, created_by)
    VALUES (
        lead_4_id,
        first_profile_id,
        timezone('utc'::text, now()) - INTERVAL '3 days',
        'Collect KYC documents and onboarding verification.',
        'completed',
        timezone('utc'::text, now()) - INTERVAL '2 days',
        first_profile_id
    ) ON CONFLICT DO NOTHING;

    -- Insert Sample Activity Timeline Events
    INSERT INTO public.activities (lead_id, actor_id, activity_type, description, metadata)
    VALUES
    (lead_1_id, first_profile_id, 'created', 'Lead created from Website enquiry form', '{"source": "Website"}'::jsonb),
    (lead_2_id, first_profile_id, 'status_changed', 'Status changed from New to Contacted', '{"from": "New", "to": "Contacted"}'::jsonb),
    (lead_4_id, first_profile_id, 'status_changed', 'Status changed from Qualified to Converted (Enrolled)', '{"from": "Qualified", "to": "Converted"}'::jsonb),
    (lead_4_id, first_profile_id, 'follow_up_completed', 'Completed follow-up: Collect KYC documents and onboarding verification', '{}'::jsonb),
    (lead_5_id, first_profile_id, 'status_changed', 'Status changed to Lost. Reason: Batch timings clash with current college schedule', '{"reason": "Batch timings clash"}'::jsonb)
    ON CONFLICT DO NOTHING;

END $$;
