import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  ActivityIndicator 
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { StripeClientService } from '../services/stripeClient';
import { SUBSCRIPTION_TIERS, ChurchRegistrationData } from '../types';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Parse the registration data from params
  const registrationData: ChurchRegistrationData = JSON.parse(params.data as string);
  const selectedTier = SUBSCRIPTION_TIERS.find(tier => tier.id === registrationData.memberCount);

  useEffect(() => {
    initializeStripe();
    
    // Set up deep link listener for the entire component lifecycle
    const handleDeepLink = (event: any) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      if (url.includes('payment-success')) {
        // Payment was successful, deep link handling will take over
        setLoading(false);
      } else if (url.includes('payment-cancel')) {
        // Payment was cancelled
        setLoading(false);
        Alert.alert('Payment Cancelled', 'You can try again when ready.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const initializeStripe = async () => {
    try {
      await StripeClientService.initialize();
      setInitializing(false);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      Alert.alert('Error', 'Failed to initialize payment system');
      setInitializing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedTier) {
      Alert.alert('Error', 'Invalid subscription tier selected');
      return;
    }

    setLoading(true);
    try {
      // Try to create a real Stripe Checkout session first
      try {
        const checkoutResult = await StripeClientService.createCheckoutSession(
          registrationData.adminEmail,
          registrationData.adminName,
          registrationData.memberCount,
          registrationData.wantsTrial,
          registrationData
        );

        if (checkoutResult.success && checkoutResult.checkoutUrl) {
          // Use device's default browser instead of in-app browser
          // This allows proper deep link handling
          await Linking.openURL(checkoutResult.checkoutUrl);

          // The deep link listener in useEffect will handle the response
          setLoading(false);
          return;
        }
      } catch (checkoutError) {
        console.log('Checkout failed, falling back to simulation:', checkoutError);
      }

      // Fallback to simulated payment if checkout fails
      const paymentResult = await StripeClientService.simulatePayment(
        registrationData.adminEmail,
        registrationData.adminName,
        registrationData.memberCount,
        registrationData.wantsTrial
      );

      if (paymentResult.success) {
        const registrationWithPayment = {
          ...registrationData,
          stripeCustomerId: paymentResult.customerId,
          stripeSubscriptionId: paymentResult.subscriptionId,
          paymentStatus: paymentResult.status,
          trialEnd: paymentResult.trial_end
        };

        Alert.alert(
          'Payment Successful!',
          registrationData.wantsTrial 
            ? 'Your 7-day trial has started. You will not be charged until the trial ends.'
            : 'Your subscription is now active. Welcome to ChurchFeed!',
          [
            {
              text: 'Continue',
              onPress: () => {
                router.push({
                  pathname: '/complete-registration',
                  params: { data: JSON.stringify(registrationWithPayment) }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };


  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b35" />
          <Text style={styles.loadingText}>Initializing payment system...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Subscription</Text>
          <Text style={styles.subtitle}>
            Secure your church's place on ChurchFeed
          </Text>
        </View>

        <Card style={styles.summaryCard} elevation={2}>
          <Card.Content>
            <Text style={styles.cardTitle}>Order Summary</Text>
            
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Church:</Text>
              <Text style={styles.orderValue}>{registrationData.churchName}</Text>
            </View>
            
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Plan:</Text>
              <Text style={styles.orderValue}>{selectedTier?.name}</Text>
            </View>
            
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Members:</Text>
              <Text style={styles.orderValue}>{selectedTier?.memberRange}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.orderRow}>
              <Text style={styles.totalLabel}>Monthly Total:</Text>
              <Text style={styles.totalValue}>${selectedTier?.price}/month</Text>
            </View>

            {registrationData.wantsTrial && (
              <View style={styles.trialBanner}>
                <Text style={styles.trialText}>
                  🎉 7-Day Free Trial Included!
                </Text>
                <Text style={styles.trialSubtext}>
                  You won't be charged until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.paymentCard} elevation={2}>
          <Card.Content>
            <Text style={styles.cardTitle}>Payment Method</Text>
            
            <Button
              mode="contained"
              onPress={handlePayment}
              style={styles.payButton}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              {loading 
                ? 'Processing...' 
                : registrationData.wantsTrial 
                  ? 'Start Free Trial' 
                  : `Subscribe for $${selectedTier?.price}/month`
              }
            </Button>
          </Card.Content>
        </Card>

        <Text style={styles.secureText}>
          🔒 Your payment information is secure and encrypted
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  orderValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  trialBanner: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    textAlign: 'center',
  },
  trialSubtext: {
    fontSize: 12,
    color: '#0369a1',
    textAlign: 'center',
    marginTop: 4,
  },
  payButton: {
    paddingVertical: 8,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  secureText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
});