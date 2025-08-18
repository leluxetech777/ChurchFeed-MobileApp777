import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Card, 
  ActivityIndicator 
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure proper deep link handling
    const timer = setTimeout(() => {
      handlePaymentSuccess();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      const sessionId = params.session_id as string;
      
      if (sessionId) {
        // Call your backend to retrieve the session and complete registration
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/complete-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Navigate to complete registration with the payment data
          router.replace({
            pathname: '/complete-registration',
            params: { data: JSON.stringify(data.registrationData) }
          });
        } else {
          // Fallback - navigate to a generic success page
          router.replace('/thank-you-church');
        }
      } else {
        // No session ID, navigate to thank you page
        router.replace('/thank-you-church');
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      // Navigate to thank you page as fallback
      router.replace('/thank-you-church');
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
            <Text style={styles.title}>Payment Successful!</Text>
            <Text style={styles.subtitle}>
              Processing your registration...
            </Text>
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
  },
});