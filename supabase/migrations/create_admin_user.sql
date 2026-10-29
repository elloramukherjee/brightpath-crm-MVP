-- ==============================================================================
-- BRIGHTPATH CRM: INSTANT ADMIN USER BOOTSTRAP (BYPASSES EMAIL RATE LIMITS)
-- ==============================================================================
-- Run this snippet in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/opslopzhwgqtsmtpurdf/sql/new
--
-- Credentials created:
--   Email:    admin@brightpath.edu
--   Password: Admin123!
-- ==============================================================================

-- 1. Insert pre-confirmed user into auth.users (zero emails sent, no rate limits)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@brightpath.edu',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Academy Administrator"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Upsert matching Admin profile
INSERT INTO public.profiles (id, full_name, role)
SELECT id, 'Academy Administrator', 'admin'
FROM auth.users
WHERE email = 'admin@brightpath.edu'
ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Academy Administrator';
