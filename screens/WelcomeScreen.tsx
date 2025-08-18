import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to ChurchFeed</Text>
          <Text style={styles.subtitle}>
            Choose how you'd like to get started
          </Text>
        </View>

        {/* Options Cards */}
        <View style={styles.cardsContainer}>
          {/* Register Church Card */}
          <Card style={styles.optionCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>🏛️</Text>
              </View>
              <Text style={styles.cardTitle}>Register Church</Text>
              <Text style={styles.cardDescription}>
                Set up your church account and start managing announcements for your congregation
              </Text>
              <View style={styles.features}>
                <Text style={styles.featureItem}>• Create church account</Text>
                <Text style={styles.featureItem}>• Manage multiple branches</Text>
                <Text style={styles.featureItem}>• Send announcements</Text>
                <Text style={styles.featureItem}>• 7-day free trial</Text>
              </View>
              <Button
                mode="contained"
                onPress={() => router.push('/church-registration')}
                style={styles.primaryButton}
                labelStyle={styles.buttonLabel}
              >
                Register Church
              </Button>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Join Church Feed Card */}
          <Card style={styles.optionCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>📱</Text>
              </View>
              <Text style={styles.cardTitle}>Join Church Feed</Text>
              <Text style={styles.cardDescription}>
                Join your church's announcement feed to stay connected with your community
              </Text>
              <View style={styles.features}>
                <Text style={styles.featureItem}>• Quick and easy setup</Text>
                <Text style={styles.featureItem}>• Receive push notifications</Text>
                <Text style={styles.featureItem}>• Stay updated instantly</Text>
              </View>
              <Button
                mode="outlined"
                onPress={() => router.push('/member-join')}
                style={styles.secondaryButton}
                labelStyle={styles.buttonLabel}
              >
                Join Church Feed
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Admin Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an admin account?</Text>
          <Button
            mode="text"
            onPress={() => router.push('/admin-login')}
            labelStyle={styles.loginButtonLabel}
          >
            Admin Login
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    marginBottom: 30,
  },
  optionCard: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  featureItem: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  primaryButton: {
    paddingVertical: 4,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  secondaryButton: {
    paddingVertical: 4,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderColor: '#6366f1',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#e2e8f0',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  loginButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});