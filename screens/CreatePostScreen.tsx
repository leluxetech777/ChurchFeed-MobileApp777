import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Checkbox,
  HelperText,
  IconButton,
  Chip
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Church } from '../types';

interface CreatePostData {
  content: string;
  sendToAll: boolean;
  selectedBranches: string[];
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [branches, setBranches] = useState<Church[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreatePostData>({
    defaultValues: {
      sendToAll: true,
      selectedBranches: [],
    },
  });

  const sendToAll = watch('sendToAll');
  const selectedBranches = watch('selectedBranches');

  // Load branches if user is from HQ
  useEffect(() => {
    if (user?.church_id) {
      loadBranches();
    }
  }, [user?.church_id]);

  const loadBranches = async () => {
    if (!user?.church_id) return;
    
    setLoadingBranches(true);
    try {
      const churchBranches = await DatabaseService.getChurchBranches(user.church_id);
      setBranches(churchBranches);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const toggleBranchSelection = (branchId: string) => {
    const currentSelected = selectedBranches;
    const isSelected = currentSelected.includes(branchId);
    
    if (isSelected) {
      setValue('selectedBranches', currentSelected.filter(id => id !== branchId));
    } else {
      setValue('selectedBranches', [...currentSelected, branchId]);
    }
  };

  const onSubmit = async (data: CreatePostData) => {
    if (!user?.admin || !user.church_id) {
      Alert.alert('Error', 'You must be an admin to create posts');
      return;
    }

    setLoading(true);
    try {
      // Determine target branches
      let targetBranches: string[] | undefined;
      if (branches.length > 0 && !data.sendToAll) {
        targetBranches = data.selectedBranches;
      }

      // TODO: Upload image to Supabase storage if imageUri exists
      let imageUrl: string | undefined;
      if (imageUri) {
        // For now, we'll skip image upload implementation
        // In a real app, you'd upload to Supabase storage here
        console.log('Image upload not implemented yet');
      }

      const post = await DatabaseService.createPost(
        user.church_id,
        user.admin.id,
        data.content,
        imageUrl,
        targetBranches
      );

      if (post) {
        Alert.alert(
          'Success!',
          'Your announcement has been posted successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Create Announcement</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.formCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {/* Post Content */}
            <Controller
              control={control}
              name="content"
              rules={{ 
                required: 'Announcement content is required',
                minLength: {
                  value: 10,
                  message: 'Announcement must be at least 10 characters'
                }
              }}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Announcement Content *"
                  value={value}
                  onChangeText={onChange}
                  style={styles.contentInput}
                  multiline
                  numberOfLines={6}
                  error={!!errors.content}
                  placeholder="What would you like to announce to your church?"
                />
              )}
            />
            <HelperText type="error" visible={!!errors.content}>
              {errors.content?.message}
            </HelperText>

            {/* Image Section */}
            <View style={styles.imageSection}>
              <Text style={styles.sectionTitle}>Add Image (Optional)</Text>
              
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <IconButton
                    icon="close-circle"
                    size={24}
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  />
                </View>
              ) : (
                <View style={styles.imageButtons}>
                  <Button
                    mode="outlined"
                    icon="camera"
                    onPress={takePhoto}
                    style={styles.imageButton}
                  >
                    Take Photo
                  </Button>
                  <Button
                    mode="outlined"
                    icon="image"
                    onPress={pickImage}
                    style={styles.imageButton}
                  >
                    Choose Image
                  </Button>
                </View>
              )}
            </View>

            {/* Branch Selection (HQ Only) */}
            {branches.length > 0 && (
              <View style={styles.branchSection}>
                <Text style={styles.sectionTitle}>Send To</Text>
                
                <Controller
                  control={control}
                  name="sendToAll"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.checkboxContainer}>
                      <Checkbox
                        status={value ? 'checked' : 'unchecked'}
                        onPress={() => onChange(!value)}
                      />
                      <Text style={styles.checkboxLabel}>
                        Send to all branches and headquarters
                      </Text>
                    </View>
                  )}
                />

                {!sendToAll && (
                  <View style={styles.branchList}>
                    <Text style={styles.branchListTitle}>Select Branches:</Text>
                    {branches.map((branch) => (
                      <View key={branch.id} style={styles.branchItem}>
                        <Checkbox
                          status={selectedBranches.includes(branch.id) ? 'checked' : 'unchecked'}
                          onPress={() => toggleBranchSelection(branch.id)}
                        />
                        <Text style={styles.branchName}>{branch.name}</Text>
                      </View>
                    ))}
                    
                    {selectedBranches.length > 0 && (
                      <View style={styles.selectedBranches}>
                        <Text style={styles.selectedTitle}>Selected branches:</Text>
                        <View style={styles.chipContainer}>
                          {selectedBranches.map((branchId) => {
                            const branch = branches.find(b => b.id === branchId);
                            return branch ? (
                              <Chip
                                key={branchId}
                                mode="outlined"
                                onClose={() => toggleBranchSelection(branchId)}
                                style={styles.branchChip}
                              >
                                {branch.name}
                              </Chip>
                            ) : null;
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.submitButton}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Announcement'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
  },
  contentInput: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  imageSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
  },
  branchSection: {
    marginTop: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  branchList: {
    marginTop: 8,
  },
  branchListTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  branchName: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  selectedBranches: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  branchChip: {
    marginRight: 4,
    marginBottom: 4,
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