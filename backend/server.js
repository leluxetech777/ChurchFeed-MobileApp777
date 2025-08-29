require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Webhook endpoint needs raw body
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// Price ID mapping
const PRICE_IDS = {
  tier1: process.env.STRIPE_PRICE_TIER1,
  tier2: process.env.STRIPE_PRICE_TIER2,
  tier3: process.env.STRIPE_PRICE_TIER3,
  tier4: process.env.STRIPE_PRICE_TIER4,
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Payment redirect - immediately redirects to app with session ID
app.get('/payment-redirect', (req, res) => {
  const sessionId = req.query.session_id;
  
  if (!sessionId) {
    return res.status(400).send('Missing session ID');
  }

  console.log('💳 Payment redirect for session:', sessionId);
  
  // Enhanced HTML for better redirect handling through ngrok
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Payment Successful - ChurchFeed</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      margin: 0; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .container {
      max-width: 400px;
      padding: 40px 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    .success-icon { 
      font-size: 64px; 
      margin-bottom: 20px; 
      animation: bounce 1s infinite alternate;
    }
    @keyframes bounce {
      0% { transform: scale(1); }
      100% { transform: scale(1.1); }
    }
    .title { font-size: 28px; margin-bottom: 16px; font-weight: 600; }
    .message { font-size: 16px; opacity: 0.9; margin-bottom: 30px; line-height: 1.5; }
    .app-button {
      display: inline-block;
      background: #ff6b35;
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 18px;
      box-shadow: 0 8px 32px rgba(255,107,53,0.3);
      transition: transform 0.2s ease;
    }
    .app-button:hover {
      transform: translateY(-2px);
    }
    .session-id { 
      font-size: 12px; 
      opacity: 0.7; 
      margin-top: 20px; 
      font-family: monospace; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h1 class="title">Payment Successful!</h1>
    <p class="message">
      Your church registration payment has been processed successfully. 
      <br><br>
      Tap the button below to return to ChurchFeed and complete your setup.
    </p>
    <a href="churchfeed://payment-success?session_id=${sessionId}" class="app-button" onclick="tryRedirect()">
      Open ChurchFeed App
    </a>
    <div class="session-id">Session: ${sessionId}</div>
  </div>
  
  <script>
    function tryRedirect() {
      console.log('Attempting to redirect to ChurchFeed app...');
      
      // Try multiple redirect methods
      setTimeout(() => {
        window.location.href = 'churchfeed://payment-success?session_id=${sessionId}';
      }, 100);
      
      setTimeout(() => {
        if (window.location.href.includes('payment-redirect')) {
          // If we're still on this page, the app didn't open
          alert('If the ChurchFeed app didn\\'t open automatically, please open it manually and check for your registration confirmation.');
        }
      }, 3000);
    }
    
    // Auto-redirect attempt after a short delay
    setTimeout(tryRedirect, 1500);
    
    // Analytics/logging
    console.log('Payment redirect page loaded for session:', '${sessionId}');
  </script>
</body>
</html>`;
  
  res.send(html);
});

// Verify payment session 
app.get('/verify-payment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('🔍 Verifying payment for session:', sessionId);
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log('💳 Payment status:', session.payment_status);
    
    if (session.payment_status === 'paid') {
      res.json({
        success: true,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        churchName: session.metadata?.churchName,
        customerId: session.customer,
        subscriptionId: session.subscription,
      });
    } else {
      res.json({
        success: false,
        paymentStatus: session.payment_status,
        error: 'Payment not completed'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});




// Create Church Registration (called after payment success)
app.post('/complete-church-registration', async (req, res) => {
  try {
    const { registrationData, sessionId } = req.body;
    
    console.log('Completing church registration for session:', sessionId);
    
    // Here you would call your church creation logic
    // For now, return success - you'll need to integrate with your DatabaseService
    
    res.json({ 
      success: true, 
      message: 'Church registration completed'
    });
  } catch (error) {
    console.error('Error completing church registration:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      priceId,
      successUrl,
      cancelUrl,
      customerEmail,
      customerName,
      churchName,
      churchId,
      trialDays = 0,
      mode = 'subscription'
    } = req.body;

    console.log('Creating checkout session for:', {
      customerEmail,
      churchName,
      churchId,
      priceId,
      trialDays
    });

    // Get the actual Stripe price ID
    const stripePriceId = PRICE_IDS[priceId];

    if (!stripePriceId) {
      console.error('Available price IDs:', PRICE_IDS);
      console.error('Requested price ID:', priceId);
      throw new Error(`Invalid price ID: ${priceId}. Available: ${Object.keys(PRICE_IDS).join(', ')}`);
    }

    // Create checkout session configuration
    const sessionConfig = {
      payment_method_types: ['card'],
      mode: mode,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      client_reference_id: churchId, // Store church ID for webhook
      metadata: {
        churchId: churchId,
        churchName: churchName,
        customerName: customerName,
      },
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
    };

    // Add trial period if requested
    if (trialDays > 0 && mode === 'subscription') {
      sessionConfig.subscription_data = {
        trial_period_days: trialDays,
        metadata: {
          churchId: churchId,
          churchName: churchName,
        }
      };
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Checkout session created:', session.id);

    res.json({
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

// Stripe Webhook Handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature (production)
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Webhook signature verification failed: STRIPE_WEBHOOK_SECRET not configured');
    }
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook handler functions
async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);
  console.log('📋 Session metadata:', session.metadata);
  console.log('🎯 Payment status:', session.payment_status);
  
  if (session.payment_status !== 'paid') {
    console.log('⏳ Payment not yet completed, skipping webhook processing');
    return;
  }
  
  console.log('💾 Payment completed successfully for session:', session.id);
  console.log('📧 Customer email:', session.customer_details?.email);
  console.log('🏛️ Church name:', session.metadata?.churchName);
  
  // Store session as completed for verification by mobile app
  console.log('🔄 Webhook processed - mobile app can now verify payment');
}

async function handleSubscriptionCreated(subscription) {
  console.log('📋 Subscription created:', subscription.id);
  console.log('🎯 Status:', subscription.status);
}

async function handleSubscriptionUpdated(subscription) {
  console.log('📋 Subscription updated:', subscription.id, 'Status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription) {
  console.log('📋 Subscription deleted:', subscription.id);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Invoice payment succeeded:', invoice.id);
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Add ping endpoint for testing connectivity
app.get('/ping', (req, res) => {
  res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Immediate redirect to app after payment
app.get('/payment-success', (req, res) => {
  const sessionId = req.query.session_id || 'unknown';
  
  console.log(`Payment success redirect for session: ${sessionId}`);
  
  // Send minimal HTML that immediately redirects to the app
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ChurchFeed - Redirecting...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          margin: 0; 
          background: #f8fafc;
          text-align: center;
        }
        .loading { color: #10b981; font-size: 24px; }
        .spinner { 
          width: 40px; 
          height: 40px; 
          border: 4px solid #e5e7eb; 
          border-top: 4px solid #10b981; 
          border-radius: 50%; 
          animation: spin 1s linear infinite; 
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div>
        <div class="spinner"></div>
        <div class="loading">Returning to ChurchFeed...</div>
      </div>
      
      <script>
        // Immediate redirect to app
        console.log('Redirecting to app...');
        
        // Try multiple redirect approaches
        const appUrl = "churchfeed://payment-success?session_id=${sessionId}&status=complete";
        
        // Check if we're on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isIOS) {
          // For iOS, try different approaches
          console.log('Detected iOS, trying app redirect...');
          
          // Method 1: Try direct scheme
          window.location = appUrl;
          
          // Method 2: Create invisible iframe (iOS Safari workaround)
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = appUrl;
          document.body.appendChild(iframe);
          
          // Method 3: Fallback with timeout
          setTimeout(() => {
            // If app didn't open, the user is still here
            document.body.innerHTML = \`
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                <div style="font-size: 24px; margin-bottom: 20px; color: #10b981;">Payment Successful!</div>
                <div style="font-size: 16px; margin-bottom: 30px; color: #64748b;">
                  Unable to automatically open the ChurchFeed app.<br>
                  Please tap the button below to return to the app.
                </div>
                <a href="\${appUrl}" 
                   style="background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 18px; font-weight: 600;">
                  Open ChurchFeed App
                </a>
                <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                  Session: ${sessionId}
                </div>
              </div>
            \`;
          }, 2500);
        } else {
          // For other platforms
          window.location.href = appUrl;
          
          setTimeout(() => {
            window.location.replace(appUrl);
          }, 100);
        }
      </script>
    </body>
    </html>
  `);
});

// Start server - listen on all interfaces so mobile devices can connect
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 ChurchFeed Backend Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
  console.log(`🌐 Mobile access: http://192.168.40.78:${port}/ping`);
  console.log(`💳 Stripe webhook: http://localhost:${port}/webhook`);
  console.log(`🔗 Checkout endpoint: http://localhost:${port}/create-checkout-session`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('');
    console.log('🔧 Development mode - make sure to:');
    console.log('1. Copy .env.example to .env and fill in your keys');
    console.log('2. Set up your Stripe webhook endpoint');
    console.log('3. Update your mobile app API_URL to point here');
    console.log('4. Test mobile connectivity: http://192.168.40.78:3000/ping');
  }
});