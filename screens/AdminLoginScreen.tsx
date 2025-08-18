import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  HelperText 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail } from '../lib/utils';

interface LoginData {
  email: string;
  password: string;
}

export default function AdminLoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      const result = await signIn(data.email, data.password);
      
      if (result.success) {
        router.replace('/feed');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🔐</Text>
          </View>
          <Text style={styles.title}>Admin Login</Text>
          <Text style={styles.subtitle}>
            Sign in to manage your church feed!
          </Text>
        </View>

        <Card style={styles.formCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Controller
              control={control}
              name="email"
              rules={{ 
                required: 'Email is required',
                validate: (value) => validateEmail(value) || 'Please enter a valid email address'
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!errors.email}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email?.message}
            </HelperText>

            <Controller
              control={control}
              name="password"
              rules={{ 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  secureTextEntry
                  error={!!errors.password}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password?.message}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.submitButton}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Button
              mode="text"
              onPress={() => {/* TODO: Implement forgot password */}}
              style={styles.forgotButton}
              labelStyle={styles.forgotButtonLabel}
            >
              Forgot Password?
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an admin account?
          </Text>
          <Button
            mode="text"
            onPress={() => router.push('/church-registration')}
            labelStyle={styles.linkButtonLabel}
          >
            Register Your Church
          </Button>
        </View>

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.backButton}
          labelStyle={styles.backButtonLabel}
        >
          Back to Welcome
        </Button>
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
    marginBottom: 30,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
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
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    marginTop: 8,
  },
  forgotButtonLabel: {
    fontSize: 14,
    color: '#6366f1',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  linkButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonLabel: {
    fontSize: 14,
    color: '#6366f1',
  },
});