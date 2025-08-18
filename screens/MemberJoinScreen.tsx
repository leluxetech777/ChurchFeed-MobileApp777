import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  HelperText,
  ActivityIndicator 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { MemberJoinData } from '../types';
import { validateEmail, validatePhone } from '../lib/utils';

export default function MemberJoinScreen() {
  const router = useRouter();
  const { registerMember } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberJoinData>();

  const onSubmit = async (data: MemberJoinData) => {
    setLoading(true);
    try {
      const result = await registerMember(data);
      
      if (result.success && result.member) {
        if (result.needsEmailVerification) {
          Alert.alert(
            'Welcome to ChurchFeed!',
            `You have successfully joined ${result.churchName}! Please check your email (${data.email}) to verify your account before signing in.`,
            [
              {
                text: 'Continue',
                onPress: () => router.push('/member-welcome'),
              },
            ]
          );
        } else {
          Alert.alert(
            'Welcome!',
            'You have successfully joined your church feed. You will now receive announcements and updates.',
            [
              {
                text: 'View Feed',
                onPress: () => router.push('/feed'),
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Error', 
          result.error || 'Failed to join church. Please check your church code and try again.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Join error:', error);
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
            <Text style={styles.iconText}>📱</Text>
          </View>
          <Text style={styles.title}>Join Church Feed</Text>
          <Text style={styles.subtitle}>
            Connect with your church community by entering your details below
          </Text>
        </View>

        <Card style={styles.formCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.formTitle}>Your Information</Text>
            
            <Controller
              control={control}
              name="name"
              rules={{ required: 'Your name is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Full Name *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.name}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.name}>
              {errors.name?.message}
            </HelperText>

            <Controller
              control={control}
              name="phone"
              rules={{ 
                required: 'Phone number is required',
                validate: (value) => validatePhone(value) || 'Please enter a valid phone number'
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Phone Number *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  keyboardType="phone-pad"
                  error={!!errors.phone}
                  placeholder="(555) 123-4567"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.phone}>
              {errors.phone?.message}
            </HelperText>

            <Controller
              control={control}
              name="email"
              rules={{ 
                required: 'Email is required',
                validate: (value) => validateEmail(value) || 'Please enter a valid email address'
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Email Address *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!errors.email}
                  placeholder="your.email@example.com"
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
                  value: 8,
                  message: 'Password must be at least 8 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Password must contain uppercase, lowercase, number, and special character'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Password *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  secureTextEntry
                  error={!!errors.password}
                  placeholder="Create a strong password"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password?.message}
            </HelperText>

            <Controller
              control={control}
              name="churchCode"
              rules={{ 
                required: 'Church code is required',
                minLength: {
                  value: 6,
                  message: 'Church code must be 6 characters'
                },
                maxLength: {
                  value: 6,
                  message: 'Church code must be 6 characters'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Church Code *"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  style={styles.input}
                  autoCapitalize="characters"
                  error={!!errors.churchCode}
                  placeholder="ABC123"
                  maxLength={6}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.churchCode}>
              {errors.churchCode?.message}
            </HelperText>
            
            <HelperText type="info">
              Ask your church admin for the 6-character church code
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.submitButton}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Church Feed'}
            </Button>
          </Card.Content>
        </Card>

        {/* Info Section */}
        <Card style={styles.infoCard} elevation={1}>
          <Card.Content>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>✅</Text>
                <Text style={styles.infoText}>
                  You'll be added to your church's announcement feed
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🔔</Text>
                <Text style={styles.infoText}>
                  You'll receive push notifications for new announcements
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📱</Text>
                <Text style={styles.infoText}>
                  Stay connected with your church community instantly
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Back Button */}
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
    marginTop: 10,
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
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
  },
  backButton: {
    marginTop: 10,
  },
  backButtonLabel: {
    fontSize: 14,
    color: '#6366f1',
  },
});