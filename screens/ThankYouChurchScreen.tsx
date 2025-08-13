import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ThankYouChurchScreen() {
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
            <Text style={styles.title}>Church Registered Successfully!</Text>
            <Text style={styles.message}>
              Your church has been set up and you're ready to start connecting with your congregation.
            </Text>
            <Text style={styles.instructions}>
              You can now sign in to your admin account to start posting announcements and managing your church feed.
            </Text>
            
            <Button
              mode="contained"
              onPress={() => router.replace('/admin-login')}
              style={styles.loginButton}
              labelStyle={styles.buttonLabel}
            >
              Go to Admin Login
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
    marginBottom: 16,
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