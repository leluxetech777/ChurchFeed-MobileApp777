# Stripe Webhook Setup

For your Stripe integration to work completely, you need to set up webhooks so Stripe can notify your backend when payments are successful.

## Quick Setup with ngrok (for testing)

### 1. Install ngrok
```bash
# Install ngrok (if not already installed)
brew install ngrok
# or download from https://ngrok.com/
```

### 2. Expose your local server
```bash
ngrok http 3000
```

This will give you a URL like: `https://abc123.ngrok.io`

### 3. Set up webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Use your ngrok URL: `https://abc123.ngrok.io/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update your `backend/.env` file:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here
   ```
8. Restart your backend server

## Alternative: Test without webhooks

For immediate testing, you can comment out the webhook secret verification in `server.js` (line 67):

```javascript
// Comment out this line for testing:
// event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

// And replace with:
event = JSON.parse(req.body.toString());
```

⚠️ **Only do this for testing! Re-enable verification for production.**

## Production Setup

For production, you'll need to:
1. Deploy your backend to a service like Railway, Render, or Heroku
2. Use the production webhook URL in Stripe Dashboard
3. Get a production webhook secret
4. Never disable webhook verification in production

## Testing Your Setup

Once webhooks are configured:
1. Complete a payment through your mobile app
2. Check your backend logs for webhook events
3. Verify your database is updated with subscription status