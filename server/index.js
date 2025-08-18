const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

// Middleware
app.use(cors());
app.use(express.json());

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { 
      email, 
      name, 
      priceId, 
      trialDays, 
      registrationData,
      env = 'dev' // 'dev' for Expo Go, 'prod' for standalone
    } = req.body;

    // First, create a customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        churchName: registrationData.churchName,
        adminRole: registrationData.adminRole,
        source: 'ChurchFeed'
      }
    });

    // Configure URLs based on environment
    let successUrl, cancelUrl;
    
    if (env === 'dev') {
      // Expo Go URLs - use your local IP with redirect page
      const localIP = '192.168.40.78'; // Your current IP
      successUrl = `http://${localIP}:3000/redirect-success?session_id={CHECKOUT_SESSION_ID}&app_url=exp://${localIP}:8081/--/payment-success`;
      cancelUrl = `http://${localIP}:3000/redirect-cancel?app_url=exp://${localIP}:8081/--/payment-cancel`;
    } else {
      // Production URLs with redirect page
      successUrl = `https://your-domain.com/redirect-success?session_id={CHECKOUT_SESSION_ID}&app_url=churchfeed://payment-success`;
      cancelUrl = `https://your-domain.com/redirect-cancel?app_url=churchfeed://payment-cancel`;
    }

    // Create the checkout session
    const sessionData = {
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        registrationData: JSON.stringify(registrationData),
        customerId: customer.id,
        env: env
      },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    };

    // Add trial if requested
    if (trialDays > 0) {
      sessionData.subscription_data = {
        trial_period_days: trialDays,
        metadata: {
          registrationData: JSON.stringify(registrationData),
          customerId: customer.id
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log(`✅ Created checkout session for ${env} environment`);
    console.log(`📱 Success URL: ${successUrl}`);
    console.log(`❌ Cancel URL: ${cancelUrl}`);

    res.status(200).json({
      url: session.url,
      sessionId: session.id,
      customerId: customer.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Create Portal Session
app.post('/api/create-portal-session', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'churchfeed://settings',
    });

    res.status(200).json({
      url: session.url
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ 
      error: 'Failed to create portal session',
      details: error.message 
    });
  }
});

// Complete Payment
app.post('/api/complete-payment', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const registrationData = JSON.parse(session.metadata?.registrationData || '{}');
    const customerId = session.customer;
    const subscription = session.subscription;

    const registrationWithPayment = {
      ...registrationData,
      stripeCustomerId: typeof customerId === 'string' ? customerId : customerId?.id,
      stripeSubscriptionId: typeof subscription === 'string' ? subscription : subscription?.id,
      paymentStatus: session.payment_status === 'paid' ? 'active' : 'incomplete',
      sessionId: session.id
    };

    res.status(200).json({
      success: true,
      registrationData: registrationWithPayment,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({ 
      error: 'Failed to complete payment',
      details: error.message 
    });
  }
});

// Redirect pages for Stripe
app.get('/redirect-success', (req, res) => {
  const { session_id, app_url } = req.query;
  const finalUrl = `${app_url}?session_id=${session_id}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f8fafc;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .success { color: #10b981; font-size: 48px; }
        h1 { color: #1e293b; margin: 20px 0; }
        p { color: #64748b; margin-bottom: 30px; }
        .btn {
          background: #ff6b35;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your subscription has been activated.</p>
        <a href="${finalUrl}" class="btn">Return to ChurchFeed</a>
      </div>
      <script>
        // Auto redirect after 3 seconds
        setTimeout(() => {
          window.location.href = "${finalUrl}";
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

app.get('/redirect-cancel', (req, res) => {
  const { app_url } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f8fafc;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .cancel { color: #ef4444; font-size: 48px; }
        h1 { color: #1e293b; margin: 20px 0; }
        p { color: #64748b; margin-bottom: 30px; }
        .btn {
          background: #64748b;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="cancel">❌</div>
        <h1>Payment Cancelled</h1>
        <p>No charge was made to your account.</p>
        <a href="${app_url}" class="btn">Return to ChurchFeed</a>
      </div>
      <script>
        // Auto redirect after 5 seconds
        setTimeout(() => {
          window.location.href = "${app_url}";
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ChurchFeed API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 ChurchFeed API server running on port ${PORT}`);
  console.log(`💳 Stripe integration ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});