-- ChurchFeed Test Data Setup
-- Run this in your Supabase SQL Editor to create test accounts

-- First, create test users in auth.users (you'll need to do this in Supabase Auth UI or via API)
-- These emails need to be created in Authentication > Users first:
-- 1. pastor@testchurch.com (password: test123456)
-- 2. member@testchurch.com (password: test123456)

-- After creating the auth users, run the SQL below:

-- 1. Insert Test Church
INSERT INTO churches (id, name, address, is_hq, church_code, subscription_tier, subscription_status, created_at) 
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Grace Community Church',
  '123 Faith Street, Hope City, CA 90210',
  true,
  'GRACE1',
  'tier2',
  'active',
  NOW()
);

-- 2. Insert Test Admin (after creating pastor@testchurch.com in Supabase Auth)
-- Replace 'REPLACE_WITH_AUTH_USER_ID' with the actual user ID from auth.users
INSERT INTO admins (id, user_id, church_id, role, name, email, phone, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'REPLACE_WITH_PASTOR_AUTH_USER_ID'::uuid,  -- Get this from auth.users table
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Head Pastor',
  'Pastor John Smith',
  'pastor@testchurch.com',
  '(555) 123-4567',
  NOW()
);

-- 3. Insert Test Member (after creating member@testchurch.com in Supabase Auth)
-- Replace 'REPLACE_WITH_AUTH_USER_ID' with the actual user ID from auth.users
INSERT INTO members (id, user_id, name, phone, email, church_id, created_at)
VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  'REPLACE_WITH_MEMBER_AUTH_USER_ID'::uuid,  -- Get this from auth.users table
  'Sarah Johnson',
  '(555) 987-6543',
  'member@testchurch.com',
  '11111111-1111-1111-1111-111111111111'::uuid,
  NOW()
);

-- 4. Insert Sample Posts for Feed Testing
INSERT INTO posts (id, church_id, author_id, content, created_at)
VALUES 
(
  '44444444-4444-4444-4444-444444444444'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Welcome to Grace Community Church! 🙏 We''re excited to have you join our church family. Sunday service starts at 10 AM.',
  NOW() - INTERVAL '2 hours'
),
(
  '55555555-5555-5555-5555-555555555555'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Don''t forget about our community potluck dinner this Friday at 6 PM in the fellowship hall. Bring a dish to share! 🍽️',
  NOW() - INTERVAL '1 day'
),
(
  '66666666-6666-6666-6666-666666666666'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Prayer request: Please keep the Johnson family in your prayers as they go through a difficult time. Your support means everything. 💙',
  NOW() - INTERVAL '3 days'
),
(
  '77777777-7777-7777-7777-777777777777'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Youth group meeting moved to Saturday 2 PM due to weather. See you there! ⛅',
  NOW() - INTERVAL '5 days'
);

-- View test data to verify
SELECT 'Churches:' as table_name;
SELECT name, church_code, subscription_tier FROM churches WHERE church_code = 'GRACE1';

SELECT 'Admins:' as table_name;
SELECT name, role, email FROM admins WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Members:' as table_name;
SELECT name, email FROM members WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Posts:' as table_name;
SELECT content, created_at FROM posts WHERE church_id = '11111111-1111-1111-1111-111111111111' ORDER BY created_at DESC;