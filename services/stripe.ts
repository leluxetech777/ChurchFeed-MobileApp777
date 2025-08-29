import { initStripe } from '@stripe/stripe-react-native';
import { SubscriptionTier } from '../types';
import { api } from './apiClient';

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
    // The backend will map these tier IDs to actual Stripe Price IDs
    return tier.id; // Just pass the tier ID, backend handles the mapping
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

  static async createCheckoutSession(
    tier: SubscriptionTier,
    churchData: {
      churchName: string;
      adminEmail: string;
      adminName: string;
      churchId?: string;
    },
    wantsTrial: boolean = false
  ) {
    try {
      // Import api here to get the current base URL (which includes tunnel URL if available)
      const { api } = await import('./apiClient');
      const baseUrl = api.getBaseUrl();
      
      console.log('💳 Creating checkout session with base URL:', baseUrl);
      
      const response = await api.post('/create-checkout-session', {
        priceId: this.getPriceIdForTier(tier),
        successUrl: `${baseUrl}/payment-redirect`,
        cancelUrl: 'churchfeed://church-registration',
        customerEmail: churchData.adminEmail,
        customerName: churchData.adminName,
        churchName: churchData.churchName,
        churchId: churchData.churchId,
        trialDays: wantsTrial ? 7 : 0,
        mode: 'subscription',
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
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

POST /create-checkout-session
- Creates a Stripe Checkout session for subscription signup
- Returns checkout session URL
- Body: { priceId, successUrl, cancelUrl, customerEmail, customerName, churchName, churchId?, trialDays?, mode }

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