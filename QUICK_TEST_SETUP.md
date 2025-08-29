# Quick Test Account Setup - 2 Minutes

## Step 1: Create Auth Users (1 minute)

Go to your **Supabase Dashboard** → **Authentication** → **Users** → **Add User**

**Create these 2 users:**

### User 1 (Admin):
- Email: `pastor@testchurch.com`
- Password: `test123456`
- ✅ Confirm user immediately

### User 2 (Member):  
- Email: `member@testchurch.com`
- Password: `test123456`
- ✅ Confirm user immediately

## Step 2: Run Test Data SQL (1 minute)

Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

Copy and paste this SQL:

```sql
-- 1. Create test church
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
) ON CONFLICT (id) DO NOTHING;

-- 2. Get auth user IDs and create admin/member records
WITH auth_users AS (
  SELECT id, email FROM auth.users WHERE email IN ('pastor@testchurch.com', 'member@testchurch.com')
)
INSERT INTO admins (id, user_id, church_id, role, name, email, phone, created_at)
SELECT 
  '22222222-2222-2222-2222-222222222222'::uuid,
  au.id,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Head Pastor',
  'Pastor John Smith',
  'pastor@testchurch.com',
  '(555) 123-4567',
  NOW()
FROM auth_users au WHERE au.email = 'pastor@testchurch.com'
ON CONFLICT (id) DO NOTHING;

WITH auth_users AS (
  SELECT id, email FROM auth.users WHERE email IN ('pastor@testchurch.com', 'member@testchurch.com')
)
INSERT INTO members (id, user_id, name, phone, email, church_id, created_at)
SELECT 
  '33333333-3333-3333-3333-333333333333'::uuid,
  au.id,
  'Sarah Johnson',
  '(555) 987-6543',
  'member@testchurch.com',
  '11111111-1111-1111-1111-111111111111'::uuid,
  NOW()
FROM auth_users au WHERE au.email = 'member@testchurch.com'
ON CONFLICT (id) DO NOTHING;

-- 3. Create sample posts
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
ON CONFLICT (id) DO NOTHING;

-- 4. Verify everything was created
SELECT 'VERIFICATION:' as status;
SELECT 'Church:' as type, name, church_code FROM churches WHERE church_code = 'GRACE1';
SELECT 'Admin:' as type, name, email FROM admins WHERE email = 'pastor@testchurch.com';
SELECT 'Member:' as type, name, email FROM members WHERE email = 'member@testchurch.com';
SELECT 'Posts:' as type, COUNT(*) as count FROM posts WHERE church_id = '11111111-1111-1111-1111-111111111111';
```

Hit **Run** 

## Step 3: Test the Login Buttons

In your ChurchFeed app:

1. Go to **Admin Login** screen
2. Tap **🧪 Fill Test Admin Credentials** 
3. Tap **Sign In** → Should work!

4. Go to **Member Login** screen  
5. Tap **🧪 Fill Test Member Credentials**
6. Tap **Sign In** → Should work!

## ✅ You Now Have:

- **Test Church:** Grace Community Church (Code: GRACE1)
- **Admin Account:** pastor@testchurch.com / test123456
- **Member Account:** member@testchurch.com / test123456  
- **4 Sample Posts** in the church feed
- **One-tap login buttons** in both login screens

## 🎯 Start Building UI/UX!

You can now:
- Test admin dashboard features
- Test member feed viewing
- Create posts as admin, view as member
- Build all UI without going through registration flows

**Total setup time: 2 minutes** ⏱️