import { initStripe } from '@stripe/stripe-react-native';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../types';

export class StripeService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('Stripe publishable key not found in environment variables');
    }

    await initStripe({
      publishableKey,
      merchantIdentifier: 'merchant.com.churchfeed.app', // Replace with your merchant ID
      urlScheme: 'churchfeed', // Deep link scheme for return URLs
    });
    
    this.initialized = true;
  }

  static async createCustomer(email: string, name: string, churchId: string) {
    try {
      // In a real implementation, this would call your backend API
      // which would then create a Stripe customer
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          churchId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const data = await response.json();
      return data.customerId;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  static async createSubscription(
    customerId: string, 
    priceId: string, 
    trialDays: number = 0
  ) {
    try {
      // In a real implementation, this would call your backend API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          priceId,
          trialDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async updateSubscription(subscriptionId: string, newPriceId: string) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/update-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          newPriceId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(subscriptionId: string) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async createPaymentSheet(customerId: string, amount: number) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          amount: amount * 100, // Convert to cents
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return {
        paymentIntent: data.clientSecret,
        ephemeralKey: data.ephemeralKey,
        customer: customerId,
      };
    } catch (error) {
      console.error('Error creating payment sheet:', error);
      throw error;
    }
  }

  static getPriceIdForTier(tier: SubscriptionTier): string {
    // In a real implementation, these would be your actual Stripe Price IDs
    const priceIds = {
      tier1: 'price_tier1_monthly_10usd', // $10/month for 0-50 members
      tier2: 'price_tier2_monthly_15usd', // $15/month for 51-150 members
      tier3: 'price_tier3_monthly_20usd', // $20/month for 151-499 members
      tier4: 'price_tier4_monthly_50usd', // $50/month for 500+ members
    };
    
    return priceIds[tier.id];
  }

  static async getSubscriptionStatus(subscriptionId: string) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/subscription-status/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  static async createPortalSession(customerId: string) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: 'churchfeed://profile', // Deep link back to app
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }
}

// Sample backend API endpoints you would need to implement:
/*

POST /create-customer
- Creates a Stripe customer
- Stores customer ID in your database
- Returns customer ID

POST /create-subscription  
- Creates a Stripe subscription for the customer
- Stores subscription details in your database
- Returns subscription details

POST /update-subscription
- Updates an existing subscription (change plan)
- Updates database records
- Returns updated subscription

POST /cancel-subscription
- Cancels a subscription
- Updates database status
- Returns cancellation details

POST /create-payment-intent
- Creates a payment intent for one-time payments
- Returns client secret for payment sheet

GET /subscription-status/:id
- Returns current subscription status
- Used for checking trial status, payment failures, etc.

POST /create-portal-session
- Creates a Stripe Customer Portal session
- Returns portal URL for subscription management

*/