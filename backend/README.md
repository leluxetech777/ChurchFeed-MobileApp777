# ChurchFeed Backend API

This backend handles Stripe checkout sessions and webhook processing for ChurchFeed subscriptions.

## Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

**Required Environment Variables:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret from Stripe dashboard (starts with `whsec_`)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (not anon key!)

**Stripe Price IDs:**
You need to create these in your Stripe dashboard and update the `.env` file:
- `STRIPE_PRICE_TIER1` - For $10/month (0-50 members)
- `STRIPE_PRICE_TIER2` - For $15/month (51-150 members) 
- `STRIPE_PRICE_TIER3` - For $20/month (151-499 members)
- `STRIPE_PRICE_TIER4` - For $50/month (500+ members)

### 3. Database Setup
Make sure your Supabase database has these tables:
- `churches` table with columns: `id`, `stripe_customer_id`, `subscription_status`
- `subscriptions` table with columns: `church_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`

### 4. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3000`

## Stripe Setup

### 1. Create Products & Prices
In your Stripe Dashboard:
1. Go to Products → Create products for each tier
2. Add recurring prices for each product
3. Copy the Price IDs to your `.env` file

### 2. Configure Webhook
1. Go to Developers → Webhooks in Stripe Dashboard
2. Add endpoint: `https://yourdomain.com/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your `.env` file

## API Endpoints

### POST /create-checkout-session
Creates a Stripe checkout session for church registration.

**Request Body:**
```json
{
  "priceId": "tier1",
  "successUrl": "churchfeed://payment-success",
  "cancelUrl": "churchfeed://church-registration",
  "customerEmail": "pastor@church.com",
  "customerName": "Pastor John",
  "churchName": "First Baptist Church",
  "churchId": "uuid-here",
  "trialDays": 7,
  "mode": "subscription"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_...",
  "sessionId": "cs_..."
}
```

### POST /webhook
Handles Stripe webhook events for subscription management.

### GET /health
Health check endpoint.

## Mobile App Configuration

Update your mobile app's API URL to point to this backend:
- Development: `http://192.168.x.x:3000` (your LAN IP)
- Production: `https://your-backend-domain.com`

## Deployment

For production deployment:
1. Deploy to your preferred platform (Railway, Render, Heroku, etc.)
2. Set all environment variables
3. Update webhook URL in Stripe dashboard
4. Update mobile app's `EXPO_PUBLIC_API_URL`

## Troubleshooting

**Common Issues:**
- Webhook signature verification fails → Check webhook secret
- Database errors → Verify Supabase service role key
- Price ID errors → Confirm Stripe price IDs are correct
- CORS errors → Backend should handle CORS automatically

**Logs:**
All important events are logged to console. Check your deployment logs for debugging.