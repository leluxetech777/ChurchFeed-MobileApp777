import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { NotificationService, setupNotificationChannels } from '../services/notifications';
import { StripeClientService } from '../services/stripeClient';

function AppContent() {
  const { theme } = useAppTheme();

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Stripe
        await StripeClientService.initialize();
        
        // Initialize notifications
        await NotificationService.initialize();
        await setupNotificationChannels();
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
          <Stack.Screen name="admin-login" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="create-post" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="admin-dashboard" />
          <Stack.Screen name="thank-you-church" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="payment-success" />
          <Stack.Screen name="payment-cancel" />
          <Stack.Screen name="complete-registration" />
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
