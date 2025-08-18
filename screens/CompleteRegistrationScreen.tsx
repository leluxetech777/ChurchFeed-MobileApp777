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
import { DatabaseService } from '../services/database';
import { ChurchRegistrationData } from '../types';

interface RegistrationWithPayment extends ChurchRegistrationData {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  paymentStatus?: string;
  trialEnd?: string;
}

export default function CompleteRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const registrationData: RegistrationWithPayment = JSON.parse(params.data as string);

  useEffect(() => {
    // Auto-start registration process when screen loads
    handleCompleteRegistration();
  }, []);

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      const result = await DatabaseService.createChurch(registrationData);
      
      if (result) {
        // If payment was included, update the subscription info
        if (registrationData.stripeCustomerId && registrationData.stripeSubscriptionId) {
          await DatabaseService.createSubscription(
            result.church.id,
            registrationData.stripeCustomerId,
            registrationData.stripeSubscriptionId,
            registrationData.paymentStatus || 'active',
            registrationData.trialEnd || new Date().toISOString()
          );
        }

        const successMessage = registrationData.wantsTrial
          ? `Welcome to ChurchFeed! Your church code is: ${result.church.church_code}\n\nYour 7-day free trial has started. Enjoy exploring all our features!`
          : `Welcome to ChurchFeed! Your church code is: ${result.church.church_code}\n\nYour subscription is active and ready to use!`;

        const emailNotice = result.needsEmailVerification 
          ? `\n\nPlease check your email (${registrationData.adminEmail}) to verify your account before signing in.`
          : '';

        Alert.alert(
          'Registration Complete!',
          successMessage + emailNotice,
          [
            {
              text: 'Continue',
              onPress: () => router.push('/thank-you-church'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to complete church registration. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Registration Error', errorMessage);
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <ActivityIndicator size="large" color="#ff6b35" style={styles.spinner} />
            <Text style={styles.title}>Finalizing Your Registration</Text>
            <Text style={styles.subtitle}>
              Setting up your church account and configuring your subscription...
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressStep}>
                <Text style={styles.progressText}>✅ Church information saved</Text>
              </View>
              <View style={styles.progressStep}>
                <Text style={styles.progressText}>✅ Admin account created</Text>
              </View>
              <View style={styles.progressStep}>
                <Text style={styles.progressText}>✅ Payment processed</Text>
              </View>
              <View style={styles.progressStep}>
                <Text style={styles.progressText}>⏳ Finalizing setup...</Text>
              </View>
            </View>

            {registrationData.wantsTrial && (
              <View style={styles.trialBanner}>
                <Text style={styles.trialText}>
                  🎉 Your 7-day free trial is starting!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
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
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  cardContent: {
    padding: 30,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
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
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressStep: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  trialBanner: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#38bdf8',
    width: '100%',
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    textAlign: 'center',
  },
});