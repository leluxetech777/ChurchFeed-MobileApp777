import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  RadioButton, 
  Checkbox,
  HelperText,
  ActivityIndicator 
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { DatabaseService } from '../services/database';
import { ChurchRegistrationData, SUBSCRIPTION_TIERS } from '../types';
import { validateEmail, validatePhone } from '../lib/utils';

const ROLES = ['Head Pastor', 'Pastor', 'Secretary'] as const;

export default function ChurchRegistrationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ChurchRegistrationData>({
    defaultValues: {
      isHq: true,
      wantsTrial: true,
      memberCount: 'tier1',
    },
  });

  const isHq = watch('isHq');
  const memberCount = watch('memberCount');
  const selectedTier = SUBSCRIPTION_TIERS.find(tier => tier.id === memberCount);

  const onSubmit = async (data: ChurchRegistrationData) => {
    setLoading(true);
    try {
      const result = await DatabaseService.createChurch(data);
      
      if (result) {
        Alert.alert(
          'Success!',
          `Church registered successfully! Your church code is: ${result.church.church_code}`,
          [
            {
              text: 'Continue',
              onPress: () => router.push('/thank-you-church'),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to register church. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Register Your Church</Text>
          <Text style={styles.subtitle}>
            Set up your church account to start connecting with your congregation
          </Text>
        </View>

        <Card style={styles.formCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {/* Church Information */}
            <Text style={styles.sectionTitle}>Church Information</Text>
            
            <Controller
              control={control}
              name="churchName"
              rules={{ required: 'Church name is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Church Name *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.churchName}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.churchName}>
              {errors.churchName?.message}
            </HelperText>

            <Controller
              control={control}
              name="churchAddress"
              rules={{ required: 'Church address is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Church Address *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  multiline
                  numberOfLines={2}
                  error={!!errors.churchAddress}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.churchAddress}>
              {errors.churchAddress?.message}
            </HelperText>

            {/* Church Type */}
            <Text style={styles.sectionTitle}>Church Type</Text>
            <Controller
              control={control}
              name="isHq"
              render={({ field: { onChange, value } }) => (
                <RadioButton.Group onValueChange={(val) => onChange(val === 'true')} value={value.toString()}>
                  <View style={styles.radioOption}>
                    <RadioButton value="true" />
                    <Text style={styles.radioLabel}>Headquarters (Main Church)</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="false" />
                    <Text style={styles.radioLabel}>Branch Church</Text>
                  </View>
                </RadioButton.Group>
              )}
            />

            {!isHq && (
              <Controller
                control={control}
                name="hqChurchCode"
                rules={{ required: 'HQ church code is required for branches' }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="HQ Church Code *"
                    value={value}
                    onChangeText={onChange}
                    style={styles.input}
                    error={!!errors.hqChurchCode}
                    placeholder="Enter your headquarters church code"
                  />
                )}
              />
            )}
            {!isHq && (
              <HelperText type="error" visible={!!errors.hqChurchCode}>
                {errors.hqChurchCode?.message}
              </HelperText>
            )}

            {/* Admin Information */}
            <Text style={styles.sectionTitle}>Your Information</Text>
            
            <Controller
              control={control}
              name="adminName"
              rules={{ required: 'Your name is required' }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Your Name *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.adminName}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.adminName}>
              {errors.adminName?.message}
            </HelperText>

            <Controller
              control={control}
              name="adminRole"
              rules={{ required: 'Your role is required' }}
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={styles.inputLabel}>Your Role *</Text>
                  <RadioButton.Group onValueChange={onChange} value={value}>
                    {ROLES.map((role) => (
                      <View key={role} style={styles.radioOption}>
                        <RadioButton value={role} />
                        <Text style={styles.radioLabel}>{role}</Text>
                      </View>
                    ))}
                  </RadioButton.Group>
                </View>
              )}
            />
            <HelperText type="error" visible={!!errors.adminRole}>
              {errors.adminRole?.message}
            </HelperText>

            <Controller
              control={control}
              name="adminPhone"
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
                  error={!!errors.adminPhone}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.adminPhone}>
              {errors.adminPhone?.message}
            </HelperText>

            <Controller
              control={control}
              name="adminEmail"
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
                  error={!!errors.adminEmail}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.adminEmail}>
              {errors.adminEmail?.message}
            </HelperText>

            {/* Subscription */}
            <Text style={styles.sectionTitle}>Subscription Plan</Text>
            
            <Controller
              control={control}
              name="memberCount"
              render={({ field: { onChange, value } }) => (
                <RadioButton.Group onValueChange={onChange} value={value}>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <View key={tier.id} style={styles.tierOption}>
                      <RadioButton value={tier.id} />
                      <View style={styles.tierInfo}>
                        <Text style={styles.tierName}>{tier.name}</Text>
                        <Text style={styles.tierDetails}>
                          {tier.memberRange} members • ${tier.price}/month
                        </Text>
                      </View>
                    </View>
                  ))}
                </RadioButton.Group>
              )}
            />

            {selectedTier && (
              <Card style={styles.pricingCard}>
                <Card.Content>
                  <Text style={styles.pricingTitle}>{selectedTier.name}</Text>
                  <Text style={styles.pricingPrice}>${selectedTier.price}/month</Text>
                  <Text style={styles.pricingDescription}>
                    For churches with {selectedTier.memberRange} members
                  </Text>
                </Card.Content>
              </Card>
            )}

            <Controller
              control={control}
              name="wantsTrial"
              render={({ field: { onChange, value } }) => (
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={value ? 'checked' : 'unchecked'}
                    onPress={() => onChange(!value)}
                  />
                  <Text style={styles.checkboxLabel}>
                    Start with 7-day free trial
                  </Text>
                </View>
              )}
            />

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.submitButton}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Church'}
            </Button>
          </Card.Content>
        </Card>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    marginTop: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  inputLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  tierOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  tierInfo: {
    marginLeft: 8,
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  tierDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  pricingCard: {
    marginVertical: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 4,
  },
  pricingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
    borderRadius: 25,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});