import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '../types';

export class StripeClientService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('Stripe publishable key not found in environment variables');
    }

    await initStripe({
      publishableKey,
      merchantIdentifier: 'merchant.com.churchfeed.app',
      urlScheme: 'churchfeed',
    });
    
    this.initialized = true;
  }

  static getPriceIdForTier(tierId: 'tier1' | 'tier2' | 'tier3' | 'tier4'): string {
    const priceIds = {
      tier1: 'price_1Rw7BiP2GNZODmelb9iltqEe', // New Church - $10/month
      tier2: 'price_1Rw7CCP2GNZODmelRrLu0ofS', // Growing Church - $15/month
      tier3: 'price_1Rw7CoP2GNZODmelQ7Xzbqt5', // Established Church - $20/month
      tier4: 'price_1Rw7DTP2GNZODmelgXnzkaL1', // Mega Church - $50/month
    };
    
    return priceIds[tierId];
  }

  static getTierInfo(tierId: 'tier1' | 'tier2' | 'tier3' | 'tier4'): SubscriptionTier {
    return SUBSCRIPTION_TIERS.find(tier => tier.id === tierId)!;
  }

  // Create Stripe Checkout Session
  static async createCheckoutSession(
    customerEmail: string,
    customerName: string,
    tierId: 'tier1' | 'tier2' | 'tier3' | 'tier4',
    wantsTrial: boolean,
    registrationData: any
  ) {
    try {
      const tierInfo = this.getTierInfo(tierId);
      const priceId = this.getPriceIdForTier(tierId);
      
      // Detect environment - 'dev' for Expo Go, 'prod' for standalone
      const env = __DEV__ ? 'dev' : 'prod';
      
      // Call your backend to create a Stripe Checkout Session
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          name: customerName,
          priceId,
          trialDays: wantsTrial ? 7 : 0,
          registrationData,
          env // Pass environment to server
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return {
        success: true,
        checkoutUrl: data.url,
        sessionId: data.sessionId
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // For testing with simulated payment (backup method)
  static async simulatePayment(
    customerEmail: string,
    customerName: string,
    tierId: 'tier1' | 'tier2' | 'tier3' | 'tier4',
    wantsTrial: boolean
  ) {
    try {
      const tierInfo = this.getTierInfo(tierId);
      
      // Simulate a delay for payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success: true,
        customerId: `cus_test_${Date.now()}`,
        subscriptionId: `sub_test_${Date.now()}`,
        paymentMethodId: `pm_test_${Date.now()}`,
        clientSecret: `pi_test_${Date.now()}_secret_test`,
        status: wantsTrial ? 'trialing' : 'active',
        trial_end: wantsTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
      };
    } catch (error) {
      console.error('Error simulating payment:', error);
      throw error;
    }
  }

  // This would be used when you have a real backend
  static async createRealPayment(
    customerEmail: string,
    customerName: string,
    tierId: 'tier1' | 'tier2' | 'tier3' | 'tier4',
    wantsTrial: boolean
  ) {
    try {
      const tierInfo = this.getTierInfo(tierId);
      const priceId = this.getPriceIdForTier(tierId);
      
      // This would call your actual backend API
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          name: customerName,
          priceId,
          trialDays: wantsTrial ? 7 : 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating real payment:', error);
      throw error;
    }
  }
}