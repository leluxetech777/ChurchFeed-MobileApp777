import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Text, 
  Button, 
  Card 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentCancelScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.title}>Payment Cancelled</Text>
            <Text style={styles.subtitle}>
              Your payment was cancelled. You can try again when you're ready.
            </Text>
            
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Try Again
            </Button>

            <Button
              mode="text"
              onPress={() => router.push('/')}
              style={styles.homeButton}
              labelStyle={styles.homeButtonLabel}
            >
              Go Home
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
  button: {
    marginBottom: 12,
    paddingVertical: 8,
    borderRadius: 25,
    minWidth: 200,
  },
  homeButton: {
    marginTop: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  homeButtonLabel: {
    fontSize: 14,
    color: '#64748b',
  },
});