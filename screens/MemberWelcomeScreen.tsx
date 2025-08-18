import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MemberWelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎉</Text>
            </View>
            <Text style={styles.title}>Welcome to Your Church Feed!</Text>
            <Text style={styles.message}>
              You have successfully joined your church community on ChurchFeed.
            </Text>
            
            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Check your email for a verification link</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Click the verification link to activate your account</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Sign in to view your church announcements</Text>
              </View>
            </View>
            
            <Text style={styles.instructions}>
              Please verify your email before signing in. Check your spam folder if you don't see the verification email.
            </Text>
            
            <Button
              mode="contained"
              onPress={() => router.replace('/member-login')}
              style={styles.loginButton}
              labelStyle={styles.buttonLabel}
              buttonColor="#ff6b35"
            >
              Go to Member Login
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => router.replace('/welcome')}
              style={styles.backButton}
              labelStyle={styles.backButtonLabel}
            >
              Back to Welcome
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
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  cardContent: {
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 40,
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
    lineHeight: 22,
    marginBottom: 24,
  },
  stepContainer: {
    width: '100%',
    marginBottom: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff6b35',
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 25,
    marginBottom: 12,
  },
  backButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
});