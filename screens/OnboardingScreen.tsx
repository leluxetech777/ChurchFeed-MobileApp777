import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import FloatingMessages from '../components/FloatingMessages';
import { useFonts, Modak_400Regular } from '@expo-google-fonts/modak';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  let [fontsLoaded] = useFonts({
    Modak_400Regular,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
          style={styles.gradient}
        >
          {/* Show floating messages even while fonts load */}
          <FloatingMessages />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
        style={styles.gradient}
      >
        {/* Floating Messages - Behind main content */}
        <FloatingMessages />
        
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo/Icon Area */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>📱</Text>
            </View>
            <View style={styles.appNameContainer}>
              <Text style={styles.appNameChurch}>Church</Text>
              <Text style={styles.appNameFeed}>Feed</Text>
            </View>
            <Text style={styles.tagline}>
              Connect your church community with instant announcements or just join the Church Feed!
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🏛️</Text>
              <Text style={styles.featureText}>Church Management</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📢</Text>
              <Text style={styles.featureText}>Instant Announcements</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🔔</Text>
              <Text style={styles.featureText}>Push Notifications</Text>
            </View>
          </View>

          {/* Get Started Button */}
          <Button
            mode="contained"
            onPress={() => router.push('/welcome')}
            style={styles.getStartedButton}
            labelStyle={styles.buttonLabel}
            buttonColor="#ff6b35"
            textColor="#ffffff"
          >
            Get Started
          </Button>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10, // Ensure main content appears above floating messages
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  appNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  appNameChurch: {
    fontSize: 44,
    fontFamily: 'Modak_400Regular',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appNameFeed: {
    fontSize: 44,
    fontFamily: 'Modak_400Regular',
    color: '#ea580c',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuresContainer: {
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    textShadowColor: 'rgba(234, 88, 12, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  getStartedButton: {
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});