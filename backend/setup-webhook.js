const stripe = require('stripe')('rk_test_51R6SNaP2GNZODmel4eywdZoIg3YDpwZkk70QbYwnSBHhc7Q9ohEn6XiXyZAkzuK19boiYluimTsjksq75LE9g9Nm00pvNgOd6q');

async function setupWebhook() {
  try {
    console.log('🔗 Setting up Stripe webhook...');
    
    // First, list existing endpoints to see if we already have one
    const existingEndpoints = await stripe.webhookEndpoints.list();
    
    console.log('Existing webhook endpoints:');
    existingEndpoints.data.forEach((endpoint, index) => {
      console.log(`${index + 1}. ${endpoint.url} (${endpoint.status})`);
    });
    
    // Delete any existing endpoints for our URL to avoid duplicates
    const ourUrl = 'http://192.168.40.78:3000/webhook';
    const existingOurEndpoints = existingEndpoints.data.filter(ep => ep.url === ourUrl);
    
    for (const endpoint of existingOurEndpoints) {
      console.log(`🗑️ Deleting existing endpoint: ${endpoint.id}`);
      await stripe.webhookEndpoints.del(endpoint.id);
    }
    
    // Create new webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: ourUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
      ],
      api_version: '2023-10-16', // Use latest stable API version
    });
    
    console.log('✅ Webhook endpoint created successfully!');
    console.log('📍 URL:', webhookEndpoint.url);
    console.log('🔑 Webhook Secret:', webhookEndpoint.secret);
    console.log('📋 Events:', webhookEndpoint.enabled_events);
    
    console.log('\n🔧 Next steps:');
    console.log('1. Copy this webhook secret to your .env file:');
    console.log(`   STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);
    console.log('2. Restart your backend server');
    console.log('3. Test a payment to verify webhook delivery');
    
    return webhookEndpoint;
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

// Run the setup
setupWebhook();