# ChurchFeed Test Accounts

## 🚀 Quick Setup Instructions

### 1. Create Auth Users in Supabase
Go to your Supabase Dashboard → Authentication → Users → Add User:

**Test Admin User:**
- Email: `pastor@testchurch.com`
- Password: `test123456`
- Confirm Password: Yes

**Test Member User:**
- Email: `member@testchurch.com`  
- Password: `test123456`
- Confirm Password: Yes

### 2. Run Test Data SQL
1. Copy the contents of `test-data-setup.sql`
2. Go to Supabase Dashboard → SQL Editor
3. **IMPORTANT:** Replace the placeholder UUIDs with actual auth user IDs:
   - Get the UUID for `pastor@testchurch.com` from Authentication → Users
   - Get the UUID for `member@testchurch.com` from Authentication → Users
   - Replace `REPLACE_WITH_PASTOR_AUTH_USER_ID` and `REPLACE_WITH_MEMBER_AUTH_USER_ID`
4. Run the SQL script

---

## 🧪 Test Accounts

### 👨‍💼 Church Admin Account
- **Email:** `pastor@testchurch.com`
- **Password:** `test123456`
- **Role:** Head Pastor
- **Name:** Pastor John Smith
- **Church:** Grace Community Church
- **Church Code:** `GRACE1`

**What you can test:**
- Admin dashboard
- Create posts
- View church members
- Church management features

### 👥 Church Member Account  
- **Email:** `member@testchurch.com`
- **Password:** `test123456`
- **Name:** Sarah Johnson
- **Church:** Grace Community Church (same as admin)

**What you can test:**
- Member feed view
- View church announcements
- Member profile features

---

## 🎯 Quick Login (Development)

Both login screens now have **🧪 Fill Test Credentials** buttons that automatically fill in the test account info - just tap and sign in!

### Admin Login Screen:
- Tap "🧪 Fill Test Admin Credentials" 
- Hit "Sign In"
- Redirects to Admin Dashboard

### Member Login Screen:
- Tap "🧪 Fill Test Member Credentials"
- Hit "Sign In" 
- Redirects to Church Feed

---

## 📱 Sample Data Created

### Test Church: "Grace Community Church"
- **Church Code:** `GRACE1`
- **Address:** 123 Faith Street, Hope City, CA 90210
- **Subscription:** Tier 2 (Active)
- **Type:** Headquarters Church

### Sample Posts for Feed Testing:
1. **Welcome Post** - "Welcome to Grace Community Church! 🙏 We're excited to have you join our church family..."
2. **Potluck Dinner** - "Don't forget about our community potluck dinner this Friday at 6 PM..."
3. **Prayer Request** - "Prayer request: Please keep the Johnson family in your prayers..."
4. **Youth Group** - "Youth group meeting moved to Saturday 2 PM due to weather..."

---

## 🔧 Testing Scenarios

### UI/UX Testing You Can Do:

**Admin Flow:**
1. Login as admin → See dashboard
2. View church feed with admin privileges  
3. Create new posts
4. Access member management
5. Test admin-only features

**Member Flow:**
1. Login as member → See feed directly
2. View posts from admin
3. Test member-only features
4. Profile management

**Cross-Testing:**
1. Create post as admin
2. Login as member and verify post appears
3. Test real-time updates
4. Verify proper permissions

---

## ⚠️ Important Notes

- These are **development test accounts only**
- Use the same church (`GRACE1`) for both admin and member
- Both accounts point to the same church for realistic testing
- The 🧪 test buttons will be removed before production
- Sample posts include realistic church content for UI testing

---

## 🔄 Reset Test Data

If you need to reset or modify test data:

1. Go to Supabase → Table Editor
2. Clear data from: `posts`, `members`, `admins`, `churches`
3. Re-run the SQL setup script with fresh UUIDs

---

**Now you can build and test all the UI/UX without going through registration flows!** 🎉