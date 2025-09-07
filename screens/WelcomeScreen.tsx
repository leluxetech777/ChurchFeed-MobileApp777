import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Liquid Glass Background with ChurchFeed Vibrant Theme */}
      <LinearGradient
        colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
        style={styles.backgroundGradient}
        locations={[0, 0.3, 0.7, 1]}
      >
        <ScrollView 
          contentContainerStyle={[styles.content, { 
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40 
          }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Glass Effect */}
          <View style={styles.headerContainer}>
            <BlurView intensity={60} tint="light" style={styles.headerGlass}>
              <Text style={styles.title}>Welcome to ChurchFeed</Text>
              <Text style={styles.subtitle}>
                Choose how you'd like to get started
              </Text>
            </BlurView>
          </View>

          {/* Liquid Glass Cards Container */}
          <View style={styles.cardsContainer}>
            {/* Register Church Glass Card */}
            <BlurView intensity={80} tint="light" style={styles.glassCard}>
              <View style={styles.glassCardContent}>
                <View style={styles.liquidGlassIcon}>
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
                <BlurView intensity={100} tint="light" style={styles.glassButton}>
                  <Button
                    mode="text"
                    onPress={() => router.push('/church-registration')}
                    style={styles.primaryButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Register Church
                  </Button>
                </BlurView>
              </View>
            </BlurView>

            {/* Liquid Glass Divider */}
            <BlurView intensity={40} tint="light" style={styles.glassDivider} />

            {/* Join Church Feed Glass Card */}
            <BlurView intensity={80} tint="light" style={styles.glassCard}>
              <View style={styles.glassCardContent}>
                <View style={styles.liquidGlassIcon}>
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
                  <Text style={styles.featureItem}>• No account required</Text>
                </View>
                <BlurView intensity={100} tint="light" style={styles.glassButton}>
                  <Button
                    mode="text"
                    onPress={() => router.push('/member-join')}
                    style={styles.secondaryButton}
                    labelStyle={styles.buttonLabel}
                  >
                    Join Church Feed
                  </Button>
                </BlurView>
              </View>
            </BlurView>
          </View>

          {/* Glass Login Links */}
          <View style={styles.loginContainer}>
            <BlurView intensity={60} tint="light" style={styles.loginGlass}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <View style={styles.loginButtons}>
                <Button
                  mode="text"
                  onPress={() => router.push('/admin-login')}
                  labelStyle={styles.loginButtonLabel}
                >
                  Admin Login
                </Button>
                <Text style={styles.loginSeparator}>•</Text>
                <Button
                  mode="text"
                  onPress={() => router.push('/member-login')}
                  labelStyle={styles.loginButtonLabel}
                >
                  Member Login
                </Button>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    flexGrow: 1,
  },
  // Header Container
  headerContainer: {
    borderRadius: 28,
    marginBottom: 40,
    marginTop: 20,
    overflow: 'hidden', // This ensures nothing bleeds outside the rounded corners
  },
  // Liquid Glass Header
  headerGlass: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    // Liquid Glass Shadow Effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    // Glass Border
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.85)',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardsContainer: {
    marginBottom: 30,
  },
  // Main Liquid Glass Cards
  glassCard: {
    marginBottom: 24,
    borderRadius: 28,
    overflow: 'hidden',
    // Enhanced Liquid Glass Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
    // Lensing Effect Border
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassCardContent: {
    padding: 28,
    alignItems: 'center',
  },
  // Liquid Glass Icon with Lensing
  liquidGlassIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Lensing Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconText: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.75)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  features: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  // Liquid Glass Buttons
  glassButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0, 0, 0, 0.9)',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  // Liquid Glass Divider
  glassDivider: {
    height: 2,
    marginVertical: 16,
    borderRadius: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Login Container
  loginContainer: {
    borderRadius: 28,
    marginTop: 20,
    overflow: 'hidden', // This ensures nothing bleeds outside the rounded corners
  },
  // Glass Login Section
  loginGlass: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    marginBottom: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loginButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginSeparator: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    marginHorizontal: 12,
  },
  loginButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.8)',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});