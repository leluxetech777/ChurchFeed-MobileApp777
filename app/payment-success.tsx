import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '../services/database';

interface PendingRegistration {
  registrationData: any;
  selectedTier: any;
  timestamp: number;
}

interface CompletedRegistration {
  church: {
    id: string;
    church_code: string;
    name: string;
  };
  admin: {
    id: string;
    name: string;
    email: string;
  };
  needsEmailVerification: boolean;
  adminEmail: string;
}

const PENDING_REGISTRATION_KEY = 'churchfeed_pending_registration';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState<CompletedRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    completeRegistration();
  }, []);

  const completeRegistration = async () => {
    try {
      const sessionId = params.session_id as string;
      
      if (!sessionId) {
        console.log('⚠️ No session ID found - redirecting to welcome');
        setTimeout(() => {
          router.push('/welcome');
        }, 3000);
        return;
      }

      console.log('✅ Payment successful! Session ID:', sessionId);
      
      // First, verify the payment was successful with Stripe
      const verifyResponse = await fetch(`http://192.168.40.78:3000/verify-payment/${sessionId}`);
      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified successfully!');

      // Get the stored pending registration data from AsyncStorage
      const pendingDataString = await AsyncStorage.getItem(PENDING_REGISTRATION_KEY);
      
      if (!pendingDataString) {
        console.log('⚠️ No pending registration data found - showing generic success');
        setRegistrationData({
          church: {
            id: 'unknown',
            church_code: 'Check your email for details',
            name: verifyData.churchName || 'Your Church'
          },
          admin: {
            id: 'unknown',
            name: 'Church Admin',
            email: verifyData.customerEmail || ''
          },
          needsEmailVerification: true,
          adminEmail: verifyData.customerEmail || ''
        });
        return;
      }

      const pendingData: PendingRegistration = JSON.parse(pendingDataString);
      
      if (!pendingData.registrationData) {
        throw new Error('Invalid registration data. Please try registering again.');
      }

      console.log('🏗️ Creating church in database...');
      
      // Now create the church in the database using DatabaseService (original approach)
      const result = await DatabaseService.createChurch(pendingData.registrationData);
      
      if (result) {
        console.log('✅ Church created successfully!', result.church.church_code);
        console.log('📧 Supabase verification email sent to:', result.admin.email);
        
        setRegistrationData({
          church: result.church,
          admin: result.admin,
          needsEmailVerification: result.needsEmailVerification,
          adminEmail: result.admin.email,
        });
        
        // Clear the pending data from AsyncStorage
        await AsyncStorage.removeItem(PENDING_REGISTRATION_KEY);
        console.log('🧹 Cleaned up pending registration data');
      } else {
        throw new Error('Failed to create church record');
      }
      
    } catch (error: any) {
      console.error('❌ Error completing registration:', error);
      setError(error.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!registrationData) {
      // Fallback if no registration data is available
      Alert.alert(
        'Payment Successful!',
        'Your subscription has been activated. You can now sign in to your ChurchFeed account.',
        [
          {
            text: 'Continue',
            onPress: () => router.push('/welcome'),
          },
        ]
      );
      return;
    }

    if (registrationData.needsEmailVerification) {
      Alert.alert(
        'Registration Complete!',
        `Welcome to ChurchFeed! Your church code is: ${registrationData.church.church_code}\n\nPlease check your email (${registrationData.adminEmail}) to verify your account before signing in.`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/thank-you-church'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Registration Complete!',
        `Church registered successfully! Your church code is: ${registrationData.church.church_code}`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/thank-you-church'),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Card style={styles.successCard} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <ActivityIndicator size="large" color="#ff6b35" style={styles.loader} />
              <Text style={styles.title}>Completing Registration...</Text>
              <Text style={styles.message}>
                Payment successful! We&apos;re now setting up your church account.
                {'\n\n'}
                Please wait a moment...
              </Text>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Card style={styles.successCard} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.title}>Registration Error</Text>
              <Text style={styles.message}>
                Payment was successful, but there was an issue completing your registration:
                {'\n\n'}
                {error}
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push('/welcome')}
                style={styles.continueButton}
                labelStyle={styles.buttonLabel}
              >
                Return to Welcome
              </Button>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Card style={styles.successCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.successIcon}>
              <Text style={styles.checkmark}>✅</Text>
            </View>
            
            <Text style={styles.title}>Registration Complete!</Text>
            
            <Text style={styles.message}>
              Thank you for subscribing to ChurchFeed! Your payment has been processed and your church has been registered successfully.
            </Text>
            
            {registrationData && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Church Details:</Text>
                <Text style={styles.churchName}>{registrationData.church.name}</Text>
                <Text style={styles.churchCode}>
                  Church Code: {registrationData.church.church_code}
                </Text>
              </View>
            )}
            
            <Text style={styles.nextSteps}>
              {registrationData.needsEmailVerification 
                ? `Please check your email (${registrationData.adminEmail}) to verify your account before signing in.`
                : 'You can now start connecting with your congregation and managing your church feed.'
              }
            </Text>
            
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
              labelStyle={styles.buttonLabel}
            >
              Complete Setup
            </Button>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  cardContent: {
    alignItems: 'center',
    padding: 30,
  },
  successIcon: {
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  churchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  churchCode: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  nextSteps: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#10b981',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loader: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
});