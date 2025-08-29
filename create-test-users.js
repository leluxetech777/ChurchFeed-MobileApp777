#!/usr/bin/env node

/**
 * Create test users using the existing ChurchFeed registration system
 * This creates real users that can be used for UI/UX testing
 */

const { DatabaseService } = require('./services/database');
const { SUBSCRIPTION_TIERS } = require('./types');

async function createTestUsers() {
  console.log('🧪 Creating test users for ChurchFeed...\n');

  try {
    // 1. Create test church with admin
    console.log('1️⃣ Creating test church and admin...');
    
    const testChurchData = {
      churchName: 'Grace Community Church',
      churchAddress: '123 Faith Street, Hope City, CA 90210',
      isHq: true,
      adminName: 'Pastor John Smith',
      adminRole: 'Head Pastor',
      adminPhone: '(555) 123-4567',
      adminEmail: 'pastor@testchurch.com',
      adminPassword: 'test123456',
      memberCount: 'tier2',
      wantsTrial: false
    };

    const churchResult = await DatabaseService.createChurch(testChurchData);
    
    if (churchResult) {
      console.log('✅ Test church created!');
      console.log('   Church:', churchResult.church.name);
      console.log('   Code:', churchResult.church.church_code);
      console.log('   Admin:', churchResult.admin.email);
      console.log('   Email verification needed:', churchResult.needsEmailVerification);
      
      // Save the church code for member registration
      const churchCode = churchResult.church.church_code;
      
      // 2. Create test member
      console.log('\n2️⃣ Creating test member...');
      
      const testMemberData = {
        name: 'Sarah Johnson',
        phone: '(555) 987-6543',
        email: 'member@testchurch.com',
        churchCode: churchCode,
        password: 'test123456'
      };

      const memberResult = await DatabaseService.createMember(testMemberData);
      
      if (memberResult) {
        console.log('✅ Test member created!');
        console.log('   Member:', memberResult.member.name);
        console.log('   Email:', memberResult.member.email);
        console.log('   Church:', memberResult.church.name);
        
        // 3. Create sample posts
        console.log('\n3️⃣ Creating sample posts...');
        await createSamplePosts(churchResult.church.id, churchResult.admin.id);
        
        console.log('\n🎉 Test accounts ready!');
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('👨‍💼 Admin Login: pastor@testchurch.com / test123456');
        console.log('👥 Member Login: member@testchurch.com / test123456');
        console.log('🏛️ Church Code:', churchCode);
        console.log('\n🧪 Use the "Fill Test Credentials" buttons in the login screens!');
        
      } else {
        console.error('❌ Failed to create test member');
      }
    } else {
      console.error('❌ Failed to create test church');
    }

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  }
}

async function createSamplePosts(churchId, authorId) {
  const { supabase } = require('./lib/supabase');
  
  const samplePosts = [
    {
      church_id: churchId,
      author_id: authorId,
      content: 'Welcome to Grace Community Church! 🙏 We\'re excited to have you join our church family. Sunday service starts at 10 AM.',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    },
    {
      church_id: churchId,
      author_id: authorId,
      content: 'Don\'t forget about our community potluck dinner this Friday at 6 PM in the fellowship hall. Bring a dish to share! 🍽️',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      church_id: churchId,
      author_id: authorId,
      content: 'Prayer request: Please keep the Johnson family in your prayers as they go through a difficult time. Your support means everything. 💙',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
      church_id: churchId,
      author_id: authorId,
      content: 'Youth group meeting moved to Saturday 2 PM due to weather. See you there! ⛅',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }
  ];

  const { data, error } = await supabase
    .from('posts')
    .insert(samplePosts)
    .select();

  if (error) {
    console.error('❌ Error creating sample posts:', error);
  } else {
    console.log(`✅ Created ${data.length} sample posts`);
  }
}

// Run the script
createTestUsers();