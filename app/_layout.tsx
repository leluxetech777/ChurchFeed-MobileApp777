import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import * as Linking from 'expo-linking';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { NotificationService, setupNotificationChannels } from '../services/notifications';
import { StripeService } from '../services/stripe';

function AppContent() {
  const { theme } = useAppTheme();

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Stripe
        await StripeService.initialize();
        
        // Initialize notifications
        await NotificationService.initialize();
        await setupNotificationChannels();
        
        // Handle initial deep link
        const url = await Linking.getInitialURL();
        
        // Handle deep links when app is already open
        const handleDeepLink = (url: string) => {
          // Process deep link navigation
        };
        
        const subscription = Linking.addEventListener('url', (event) => {
          handleDeepLink(event.url);
        });
        
        return () => {
          subscription?.remove();
        };
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="church-registration" />
          <Stack.Screen name="member-join" />
          <Stack.Screen name="member-login" />
          <Stack.Screen name="admin-login" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="create-post" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="admin-dashboard" />
          <Stack.Screen name="payment-success" />
          <Stack.Screen name="thank-you-church" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
