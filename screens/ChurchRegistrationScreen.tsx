import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
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
      wantsTrial: false,
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
        if (result.needsEmailVerification) {
          Alert.alert(
            'Registration Successful!',
            `Welcome to ChurchFeed! Your church code is: ${result.church.church_code}\n\nPlease check your email (${data.adminEmail}) to verify your account before signing in.`,
            [
              {
                text: 'Continue',
                onPress: () => router.push('/thank-you-church'),
              },
            ]
          );
        } else {
          Alert.alert(
            'Registration Complete!',
            `Church registered successfully! Your church code is: ${result.church.church_code}`,
            [
              {
                text: 'Continue',
                onPress: () => router.push('/thank-you-church'),
              },
            ]
          );
        }
      } else {
        Alert.alert('Error', 'Failed to register church. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      Alert.alert('Registration Error', errorMessage);
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
              rules={{ 
                required: 'Church name is required',
                minLength: {
                  value: 3,
                  message: 'Church name must be at least 3 characters'
                },
                maxLength: {
                  value: 100,
                  message: 'Church name must be less than 100 characters'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Church Name *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.churchName}
                  placeholder="Enter your church's full name"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.churchName}>
              {errors.churchName?.message}
            </HelperText>

            <Controller
              control={control}
              name="churchAddress"
              rules={{ 
                required: 'Church address is required',
                minLength: {
                  value: 10,
                  message: 'Please enter a complete address'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Church Address *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  multiline
                  numberOfLines={2}
                  error={!!errors.churchAddress}
                  placeholder="Street address, city, state, zip code"
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
                <View style={styles.buttonGroup}>
                  <Button
                    mode={value === true ? "contained" : "outlined"}
                    onPress={() => onChange(true)}
                    style={[
                      styles.selectionButton,
                      value === true && styles.selectedButton
                    ]}
                    labelStyle={[
                      styles.selectionButtonLabel,
                      value === true && styles.selectedButtonLabel
                    ]}
                    buttonColor={value === true ? "#ff6b35" : "transparent"}
                    textColor={value === true ? "#ffffff" : "#374151"}
                  >
                    Headquarters (Main Church)
                  </Button>
                  <Button
                    mode={value === false ? "contained" : "outlined"}
                    onPress={() => onChange(false)}
                    style={[
                      styles.selectionButton,
                      value === false && styles.selectedButton
                    ]}
                    labelStyle={[
                      styles.selectionButtonLabel,
                      value === false && styles.selectedButtonLabel
                    ]}
                    buttonColor={value === false ? "#ff6b35" : "transparent"}
                    textColor={value === false ? "#ffffff" : "#374151"}
                  >
                    Branch
                  </Button>
                </View>
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
              rules={{ 
                required: 'Your name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                },
                pattern: {
                  value: /^[a-zA-Z\s'-]+$/,
                  message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Your Name *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  error={!!errors.adminName}
                  placeholder="Enter your full name"
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
                  <View style={styles.buttonGroup}>
                    {ROLES.map((role) => (
                      <Button
                        key={role}
                        mode={value === role ? "contained" : "outlined"}
                        onPress={() => onChange(role)}
                        style={[
                          styles.selectionButton,
                          value === role && styles.selectedButton
                        ]}
                        labelStyle={[
                          styles.selectionButtonLabel,
                          value === role && styles.selectedButtonLabel
                        ]}
                        buttonColor={value === role ? "#ff6b35" : "transparent"}
                        textColor={value === role ? "#ffffff" : "#374151"}
                      >
                        {role}
                      </Button>
                    ))}
                  </View>
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
                validate: (value) => validatePhone(value) || 'Please enter a valid phone number (e.g., +1 555-123-4567)'
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Phone Number *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  keyboardType="phone-pad"
                  error={!!errors.adminPhone}
                  placeholder="(555) 123-4567"
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
                  placeholder="pastor@yourchurch.com"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.adminEmail}>
              {errors.adminEmail?.message}
            </HelperText>

            <Controller
              control={control}
              name="adminPassword"
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
                  error={!!errors.adminPassword}
                  placeholder="Create a strong password"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.adminPassword}>
              {errors.adminPassword?.message}
            </HelperText>

            {/* Subscription */}
            <Text style={styles.sectionTitle}>Subscription Plan</Text>
            <Text style={styles.sectionSubtitle}>
              Choose the plan that best fits your congregation size. You can change plans anytime.
            </Text>
            
            <Controller
              control={control}
              name="memberCount"
              render={({ field: { onChange, value } }) => (
                <View style={styles.buttonGroup}>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <Button
                      key={tier.id}
                      mode={value === tier.id ? "contained" : "outlined"}
                      onPress={() => onChange(tier.id)}
                      style={[
                        styles.tierSelectionButton,
                        value === tier.id && styles.selectedButton
                      ]}
                      labelStyle={[
                        styles.tierButtonLabel,
                        value === tier.id && styles.selectedButtonLabel
                      ]}
                      buttonColor={value === tier.id ? "#ff6b35" : "transparent"}
                      textColor={value === tier.id ? "#ffffff" : "#374151"}
                      contentStyle={styles.tierButtonContent}
                    >
                      {`${tier.name}\n${tier.memberRange} members • $${tier.price}/month`}
                    </Button>
                  ))}
                </View>
              )}
            />

            {selectedTier && (
              <Card style={styles.pricingCard}>
                <Card.Content>
                  <Text style={styles.pricingTitle}>{selectedTier.name}</Text>
                  <Text style={styles.pricingPrice}>${selectedTier.price}/month</Text>
                  <Text style={styles.pricingDescription}>
                    For churches with {selectedTier.memberRange} 
                  </Text>
                </Card.Content>
              </Card>
            )}

            <Controller
              control={control}
              name="wantsTrial"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  style={[styles.checkboxContainer, value && styles.checkboxContainerSelected]}
                  onPress={() => onChange(!value)}
                  activeOpacity={0.7}
                >
                  <Checkbox
                    status={value ? 'checked' : 'unchecked'}
                    color="#ff6b35"
                    uncheckedColor="#d1d5db"
                  />
                  <Text style={[styles.checkboxLabel, value && styles.checkboxLabelSelected]}>
                    Want a 7-day free trial? Tap Here!
                  </Text>
                </TouchableOpacity>
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
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  checkboxContainerSelected: {
    borderColor: '#ff6b35',
    backgroundColor: '#fff7ed',
    elevation: 2,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  checkboxLabelSelected: {
    color: '#ea580c',
    fontWeight: '600',
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
  buttonGroup: {
    marginBottom: 16,
  },
  selectionButton: {
    marginBottom: 12,
    borderRadius: 25,
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  selectedButton: {
    borderColor: '#ff6b35',
    elevation: 2,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  selectionButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 8,
  },
  selectedButtonLabel: {
    fontWeight: '600',
  },
  tierSelectionButton: {
    marginBottom: 12,
    borderRadius: 25,
    borderColor: '#d1d5db',
    borderWidth: 1,
    minHeight: 60,
  },
  tierButtonContent: {
    paddingVertical: 12,
  },
  tierButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});