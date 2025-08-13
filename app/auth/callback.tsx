import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { token_hash, type } = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (type === 'signup' && token_hash) {
          // Handle email confirmation
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup'
          });

          if (error) {
            console.error('Email verification error:', error);
            setStatus('error');
            setMessage('Failed to verify email. The link may be expired or invalid.');
          } else {
            setStatus('success');
            setMessage('Email verified successfully! You can now sign in to your account.');
          }
        } else {
          setStatus('error');
          setMessage('Invalid verification link.');
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred.');
      }
    };

    handleAuthCallback();
  }, [token_hash, type]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Card style={styles.card} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {status === 'loading' && (
              <>
                <ActivityIndicator size="large" color="#ff6b35" />
                <Text style={styles.title}>Verifying your email...</Text>
                <Text style={styles.message}>Please wait while we confirm your account.</Text>
              </>
            )}
            
            {status === 'success' && (
              <>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>✅</Text>
                </View>
                <Text style={styles.title}>Email Verified!</Text>
                <Text style={styles.message}>{message}</Text>
                
                <Button
                  mode="contained"
                  onPress={() => router.replace('/admin-login')}
                  style={styles.loginButton}
                  labelStyle={styles.buttonLabel}
                  buttonColor="#ff6b35"
                >
                  Go to Admin Login
                </Button>
              </>
            )}
            
            {status === 'error' && (
              <>
                <View style={[styles.iconContainer, styles.errorIcon]}>
                  <Text style={styles.iconText}>❌</Text>
                </View>
                <Text style={styles.title}>Verification Failed</Text>
                <Text style={styles.message}>{message}</Text>
                
                <Button
                  mode="contained"
                  onPress={() => router.replace('/church-registration')}
                  style={styles.loginButton}
                  labelStyle={styles.buttonLabel}
                  buttonColor="#ff6b35"
                >
                  Try Registration Again
                </Button>
              </>
            )}
            
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
  errorIcon: {
    backgroundColor: '#fee2e2',
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