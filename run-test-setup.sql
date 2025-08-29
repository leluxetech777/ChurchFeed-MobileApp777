-- ChurchFeed Test Data Setup (Direct SQL)
-- Run this directly in your Supabase SQL Editor

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
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  church_code = EXCLUDED.church_code,
  updated_at = NOW();

-- 2. Create auth users (you'll need to do this manually in Supabase Auth Dashboard)
-- Go to Authentication > Users > Add User:
-- Email: pastor@testchurch.com, Password: test123456
-- Email: member@testchurch.com, Password: test123456

-- 3. After creating the auth users, get their UUIDs and replace below:
-- First, let's check if we have auth users:
SELECT 'Auth Users:' as info, email, id from auth.users where email in ('pastor@testchurch.com', 'member@testchurch.com');

-- If you see the users above, copy their UUIDs and replace XXXXXXXX below:

-- Insert Test Admin (replace XXXXXXXX with actual auth user UUID for pastor@testchurch.com)
INSERT INTO admins (id, user_id, church_id, role, name, email, phone, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'::uuid,  -- Replace with pastor's auth UUID
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Head Pastor',
  'Pastor John Smith',
  'pastor@testchurch.com',
  '(555) 123-4567',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Insert Test Member (replace XXXXXXXX with actual auth user UUID for member@testchurch.com)
INSERT INTO members (id, user_id, name, phone, email, church_id, created_at)
VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'::uuid,  -- Replace with member's auth UUID
  'Sarah Johnson',
  '(555) 987-6543',
  'member@testchurch.com',
  '11111111-1111-1111-1111-111111111111'::uuid,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email;

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
)
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  created_at = EXCLUDED.created_at;

-- 5. Verify the data was created correctly
SELECT '=== VERIFICATION ===' as status;

SELECT 'Churches:' as table_name, name, church_code, subscription_tier, subscription_status 
FROM churches WHERE church_code = 'GRACE1';

SELECT 'Admins:' as table_name, name, role, email 
FROM admins WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Members:' as table_name, name, email 
FROM members WHERE church_id = '11111111-1111-1111-1111-111111111111';

SELECT 'Posts:' as table_name, LEFT(content, 50) as content_preview, created_at 
FROM posts WHERE church_id = '11111111-1111-1111-1111-111111111111' 
ORDER BY created_at DESC;

SELECT '=== NEXT STEPS ===' as info;
SELECT '1. Go to Supabase Auth > Users' as step;
SELECT '2. Add User: pastor@testchurch.com / test123456' as step;
SELECT '3. Add User: member@testchurch.com / test123456' as step;
SELECT '4. Copy their UUIDs and replace XXXXXXXX above' as step;
SELECT '5. Re-run the admin and member INSERT statements' as step;