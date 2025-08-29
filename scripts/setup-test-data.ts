import { supabase } from '../lib/supabase';

/**
 * Setup Test Data Script
 * Creates test church and user accounts directly in Supabase
 */

export async function setupTestData() {
  console.log('🧪 Setting up ChurchFeed test data...\n');

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
        subscription_tier: 'tier2',
        subscription_status: 'active',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (churchError) {
      console.error('❌ Error creating church:', churchError);
      throw churchError;
    }
    console.log('✅ Church created:', church.name);

    // 2. Create test admin auth user (using signUp for development)
    console.log('\n2️⃣ Creating test admin user...');
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.signUp({
      email: 'pastor@testchurch.com',
      password: 'test123456'
    });

    if (adminAuthError && !adminAuthError.message.includes('already registered')) {
      console.error('❌ Error creating admin auth user:', adminAuthError);
      throw adminAuthError;
    }
    
    if (adminAuth.user) {
      console.log('✅ Admin auth user created/exists:', adminAuth.user.email);

      // 3. Create admin record
      console.log('\n3️⃣ Creating admin database record...');
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .upsert({
          id: '22222222-2222-2222-2222-222222222222',
          user_id: adminAuth.user.id,
          church_id: church.id,
          role: 'Head Pastor',
          name: 'Pastor John Smith',
          email: 'pastor@testchurch.com',
          phone: '(555) 123-4567',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (adminError) {
        console.error('❌ Error creating admin record:', adminError);
        throw adminError;
      }
      console.log('✅ Admin record created:', admin.name);
    }

    // 4. Create test member auth user
    console.log('\n4️⃣ Creating test member user...');
    const { data: memberAuth, error: memberAuthError } = await supabase.auth.signUp({
      email: 'member@testchurch.com',
      password: 'test123456'
    });

    if (memberAuthError && !memberAuthError.message.includes('already registered')) {
      console.error('❌ Error creating member auth user:', memberAuthError);
      throw memberAuthError;
    }

    if (memberAuth.user) {
      console.log('✅ Member auth user created/exists:', memberAuth.user.email);

      // 5. Create member record
      console.log('\n5️⃣ Creating member database record...');
      const { data: member, error: memberError } = await supabase
        .from('members')
        .upsert({
          id: '33333333-3333-3333-3333-333333333333',
          user_id: memberAuth.user.id,
          name: 'Sarah Johnson',
          phone: '(555) 987-6543',
          email: 'member@testchurch.com',
          church_id: church.id,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (memberError) {
        console.error('❌ Error creating member record:', memberError);
        throw memberError;
      }
      console.log('✅ Member record created:', member.name);
    }

    // 6. Create sample posts
    console.log('\n6️⃣ Creating sample posts...');
    const samplePosts = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        church_id: church.id,
        author_id: '22222222-2222-2222-2222-222222222222', // admin.id
        content: 'Welcome to Grace Community Church! 🙏 We\'re excited to have you join our church family. Sunday service starts at 10 AM.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        church_id: church.id,
        author_id: '22222222-2222-2222-2222-222222222222',
        content: 'Don\'t forget about our community potluck dinner this Friday at 6 PM in the fellowship hall. Bring a dish to share! 🍽️',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        church_id: church.id,
        author_id: '22222222-2222-2222-2222-222222222222',
        content: 'Prayer request: Please keep the Johnson family in your prayers as they go through a difficult time. Your support means everything. 💙',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        church_id: church.id,
        author_id: '22222222-2222-2222-2222-222222222222',
        content: 'Youth group meeting moved to Saturday 2 PM due to weather. See you there! ⛅',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      }
    ];

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .upsert(samplePosts, {
        onConflict: 'id'
      })
      .select();

    if (postsError) {
      console.error('❌ Error creating posts:', postsError);
      throw postsError;
    }
    console.log(`✅ Created ${posts.length} sample posts`);

    console.log('\n🎉 Test accounts setup complete!');
    console.log('\n📋 Test Credentials:');
    console.log('👨‍💼 Admin: pastor@testchurch.com / test123456');
    console.log('👥 Member: member@testchurch.com / test123456');
    console.log('🏛️ Church Code: GRACE1');
    console.log('\n🧪 Use the test buttons in the login screens!');

    return {
      church,
      adminEmail: 'pastor@testchurch.com',
      memberEmail: 'member@testchurch.com',
      churchCode: 'GRACE1'
    };

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestData().catch(console.error);
}