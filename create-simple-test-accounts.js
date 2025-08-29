#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAccounts() {
  console.log('🧪 Creating ChurchFeed test accounts...\n');

  try {
    // 1. Create test church
    console.log('1️⃣ Creating test church...');
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Grace Community Church',
        address: '123 Faith Street, Hope City, CA 90210',
        is_hq: true,
        church_code: 'GRACE1',
        subscription_tier: 'tier2'
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (churchError) {
      console.error('❌ Church error:', churchError);
      return;
    }
    console.log('✅ Church created:', church.name);

    // 2. Create admin auth user
    console.log('\n2️⃣ Creating admin user...');
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'pastor@testchurch.com',
      password: 'test123456',
      email_confirm: true
    });

    if (adminAuthError) {
      console.error('❌ Admin auth error:', adminAuthError);
      return;
    }
    console.log('✅ Admin user created:', adminAuth.user.email);

    // 3. Create admin record
    console.log('\n3️⃣ Creating admin record...');
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .upsert({
        id: '22222222-2222-2222-2222-222222222222',
        user_id: adminAuth.user.id,
        church_id: church.id,
        role: 'Head Pastor',
        name: 'Pastor John Smith',
        email: 'pastor@testchurch.com',
        phone: '(555) 123-4567'
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Admin record error:', adminError);
      return;
    }
    console.log('✅ Admin record created:', admin.name);

    // 4. Create member auth user
    console.log('\n4️⃣ Creating member user...');
    const { data: memberAuth, error: memberAuthError } = await supabase.auth.admin.createUser({
      email: 'member@testchurch.com',
      password: 'test123456',
      email_confirm: true
    });

    if (memberAuthError) {
      console.error('❌ Member auth error:', memberAuthError);
      return;
    }
    console.log('✅ Member user created:', memberAuth.user.email);

    // 5. Create member record
    console.log('\n5️⃣ Creating member record...');
    const { data: member, error: memberError } = await supabase
      .from('members')
      .upsert({
        id: '33333333-3333-3333-3333-333333333333',
        user_id: memberAuth.user.id,
        name: 'Sarah Johnson',
        phone: '(555) 987-6543',
        email: 'member@testchurch.com',
        church_id: church.id
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (memberError) {
      console.error('❌ Member record error:', memberError);
      return;
    }
    console.log('✅ Member record created:', member.name);

    // 6. Create sample posts
    console.log('\n6️⃣ Creating sample posts...');
    const samplePosts = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        church_id: church.id,
        author_id: admin.id,
        content: 'Welcome to Grace Community Church! 🙏 We\'re excited to have you join our church family. Sunday service starts at 10 AM.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        church_id: church.id,
        author_id: admin.id,
        content: 'Don\'t forget about our community potluck dinner this Friday at 6 PM in the fellowship hall. Bring a dish to share! 🍽️',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        church_id: church.id,
        author_id: admin.id,
        content: 'Prayer request: Please keep the Johnson family in your prayers as they go through a difficult time. Your support means everything. 💙',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        church_id: church.id,
        author_id: admin.id,
        content: 'Youth group meeting moved to Saturday 2 PM due to weather. See you there! ⛅',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .upsert(samplePosts, {
        onConflict: 'id'
      })
      .select();

    if (postsError) {
      console.error('❌ Posts error:', postsError);
      return;
    }
    console.log(`✅ Created ${posts.length} sample posts`);

    console.log('\n🎉 Test accounts created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('👨‍💼 Admin: pastor@testchurch.com / test123456');
    console.log('👥 Member: member@testchurch.com / test123456');
    console.log('🏛️ Church Code: GRACE1');
    console.log('\n🧪 Use the test buttons in the login screens!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestAccounts();