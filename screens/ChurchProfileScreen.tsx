import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  IconButton,
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Post } from '../types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor(width / 3); // Exact 3 columns with no spacing
const ITEM_HEIGHT = Math.floor(ITEM_WIDTH * 1.33); // 4:3 aspect ratio (rectangular like Instagram)

export default function ChurchProfileScreen() {
  const router = useRouter();
  const { user, currentMember } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [church, setChurch] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'photo' | 'video' | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileFeed, setShowProfileFeed] = useState(false);
  const insets = useSafeAreaInsets();
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [rippleScale, setRippleScale] = useState(new Animated.Value(0));
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const refreshIconAnim = useRef(new Animated.Value(0)).current;
  
  // Liquid glass button animations
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim3 = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const churchId = user?.church_id || currentMember?.church_id;
  const isAdmin = !!user?.admin;

  // Start liquid glass animations
  useEffect(() => {
    // Rotation animations for pool flow
    const createRotationAnimation = (animValue: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      );
    };

    // Start all rotation animations
    createRotationAnimation(rotateAnim1, 8000).start();
    createRotationAnimation(rotateAnim2, 6000).start();
    createRotationAnimation(rotateAnim3, 10000).start();

  }, []);

  useEffect(() => {
    if (churchId) {
      loadChurchData();
      loadPosts();
      loadMemberCount();
    }
  }, [churchId]);

  // Color rotation with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColorIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % 5;
        
        // Animate to the next color smoothly
        Animated.timing(colorAnim, {
          toValue: newIndex,
          duration: 1200, // Slower 1200ms transition
          useNativeDriver: false, // Color interpolation requires native driver to be false
        }).start();
        
        return newIndex;
      });
    }, 2000); // Change color every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const loadChurchData = async () => {
    if (!churchId) return;
    
    try {
      // Get actual church data from database
      const churchData = await DatabaseService.getChurchById(churchId);
      
      if (churchData) {
        setChurch({
          id: churchId,
          name: churchData.name,
          bio: "Welcome to our church community! Stay connected with announcements, events, and spiritual messages. Join us in worship and fellowship.",
          profileImage: null, // We can add this to the database later
          postCount: 0
        });
      } else {
        // Fallback if church data not found
        setChurch({
          id: churchId,
          name: "Our Church",
          bio: "Welcome to our church community! Stay connected with announcements, events, and spiritual messages. Join us in worship and fellowship.",
          profileImage: null,
          postCount: 0
        });
      }
    } catch (error) {
      console.error('Error loading church data:', error);
    }
  };

  const loadMemberCount = async () => {
    if (!churchId) return;
    
    try {
      const members = await DatabaseService.getChurchMembers(churchId);
      setMemberCount(members.length);
    } catch (error) {
      console.error('Error loading member count:', error);
      setMemberCount(0);
    }
  };

  const loadPosts = async () => {
    if (!churchId) return;
    
    setLoading(true);
    try {
      const churchPosts = await DatabaseService.getChurchFeed(churchId);
      setPosts(churchPosts);
      
      // Update church with post count
      setChurch(prev => prev ? { ...prev, postCount: churchPosts.length } : null);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (post: Post, postIndex: number) => {
    // Open church profile feed modal with selected post
    setSelectedPostIndex(postIndex);
    setShowProfileFeed(true);
  };

  const handleUploadPress = () => {
    // Ripple animation
    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle upload options with rotation animation
    const newShowState = !showUploadOptions;
    setShowUploadOptions(newShowState);
    
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: newShowState ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(optionsAnim, {
        toValue: newShowState ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePhotoUpload = () => {
    setModalType('photo');
    setShowModal(true);
    setShowUploadOptions(false);
    
    // Reset animations
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(optionsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVideoUpload = () => {
    setModalType('video');
    setShowModal(true);
    setShowUploadOptions(false);
    
    // Reset animations
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(optionsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectMedia = async () => {
    const options = [
      `Take ${modalType === 'photo' ? 'Photo' : 'Video'}`,
      `Choose from Gallery`,
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          title: `Add ${modalType === 'photo' ? 'Photo' : 'Video'}`,
          message: 'How would you like to add your media?'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Take Photo/Video
            captureMedia();
          } else if (buttonIndex === 1) {
            // Choose from Gallery
            pickFromGallery();
          }
        }
      );
    } else {
      // Android Alert
      Alert.alert(
        `Add ${modalType === 'photo' ? 'Photo' : 'Video'}`,
        'How would you like to add your media?',
        [
          {
            text: `Take ${modalType === 'photo' ? 'Photo' : 'Video'}`,
            onPress: captureMedia
          },
          {
            text: 'Choose from Gallery',
            onPress: pickFromGallery
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const captureMedia = async () => {
    // Request camera permissions
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraPermission.status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos and videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: modalType === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false, // Remove square crop constraint
      quality: 0.8,
      videoMaxDuration: modalType === 'video' ? 60 : undefined, // 60 seconds max for videos
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    // Request media library permissions
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (libraryPermission.status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permission is required to select photos and videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: modalType === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false, // Remove square crop constraint
      quality: 0.8,
      videoQuality: ImagePicker.VideoQuality.Medium,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Start cool rotation animation
    Animated.timing(refreshIconAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      // Reset animation value
      refreshIconAnim.setValue(0);
    });

    try {
      // Reload all data
      await Promise.all([
        loadChurchData(),
        loadPosts(),
        loadMemberCount()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedMedia(null);
    setPostText('');
  };

  const handleSubmitPost = async () => {
    if (!selectedMedia && !postText.trim()) {
      Alert.alert('Empty Post', 'Please add some content to your post');
      return;
    }

    if (!churchId) {
      Alert.alert('Error', 'Church information not found');
      return;
    }

    try {
      // For posts, we need the admin ID (not user ID) since posts.author_id references admins table
      if (!user?.admin) {
        Alert.alert('Error', 'Only church admins can create posts');
        return;
      }

      // The user object should have the admin ID when user.admin is true
      // If not, we need to query the admins table to get the admin ID
      let adminId = user.id;
      
      // Try to get admin record if needed
      try {
        const adminRecord = await DatabaseService.getAdminByUserId(user.id);
        if (adminRecord) {
          adminId = adminRecord.id;
        }
      } catch (error) {
        console.log('Could not fetch admin record, using user ID:', error);
      }

      // Save post to database using the correct method signature
      const newPost = await DatabaseService.createPost(
        churchId,
        adminId,
        postText.trim(),
        selectedMedia || undefined,
        modalType || undefined
      );

      if (newPost) {
        // Refresh posts to show the new one
        await loadPosts();
        Alert.alert('Success', `${modalType} post created successfully!`);
        handleCloseModal();
      } else {
        Alert.alert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    }
  };

  const renderChurchProfileFeed = () => {
    const mediaPosts = posts.filter(post => post.image_url || post.video_url);
    
    const renderFeedPost = ({ item: post }: { item: Post }) => (
      <View style={styles.feedPostContainer}>
        <BlurView intensity={80} tint="light" style={styles.feedPostCard}>
          {/* Post Header */}
          <View style={styles.feedPostHeader}>
            <View style={styles.feedPostAuthorInfo}>
              <Avatar.Text
                size={40}
                label={post.author_name?.substring(0, 2) || 'CH'}
                style={styles.feedPostAvatar}
              />
              <View>
                <Text style={styles.feedPostAuthorName}>
                  {post.author_name || 'Church Admin'}
                </Text>
                <Text style={styles.feedPostTime}>
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                </Text>
              </View>
            </View>
          </View>

          {/* Post Media */}
          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.feedPostImage} />
          )}
          
          {post.video_url && (
            <View style={styles.feedPostVideoContainer}>
              <Image source={{ uri: post.video_url }} style={styles.feedPostImage} />
              <View style={styles.feedPostVideoOverlay}>
                <IconButton
                  icon="play"
                  size={40}
                  iconColor="white"
                />
              </View>
            </View>
          )}

          {/* Post Content */}
          {post.content && (
            <View style={styles.feedPostContent}>
              <Text style={styles.feedPostText}>{post.content}</Text>
            </View>
          )}

          {/* Post Actions */}
          <View style={styles.feedPostActions}>
            <TouchableOpacity style={styles.feedPostAction}>
              <IconButton
                icon="heart-outline"
                size={24}
                iconColor="rgba(0,0,0,0.7)"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedPostAction}>
              <IconButton
                icon="comment-outline"
                size={24}
                iconColor="rgba(0,0,0,0.7)"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedPostAction}>
              <IconButton
                icon="share-outline"
                size={24}
                iconColor="rgba(0,0,0,0.7)"
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );

    return (
      <Modal
        visible={showProfileFeed}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowProfileFeed(false)}
      >
        <View style={styles.profileFeedContainer}>
          <LinearGradient
            colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
            style={styles.profileFeedGradient}
          >
            {/* Header */}
            <View style={styles.profileFeedHeader}>
              <TouchableOpacity onPress={() => setShowProfileFeed(false)}>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor="white"
                />
              </TouchableOpacity>
              <Text style={styles.profileFeedTitle}>
                {church?.name || 'Church'} Media
              </Text>
              <View style={{ width: 48 }} />
            </View>

            {/* Feed */}
            <FlatList
              data={mediaPosts}
              renderItem={renderFeedPost}
              keyExtractor={(item) => item.id}
              initialScrollIndex={selectedPostIndex}
              getItemLayout={(data, index) => ({
                length: 600, // Approximate height of each post
                offset: 600 * index,
                index,
              })}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.profileFeedContent}
            />
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  const renderUploadModal = () => {
    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
            style={styles.modalGradient}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal}>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor="white"
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Create {modalType === 'photo' ? 'Photo' : 'Video'} Post
              </Text>
              <TouchableOpacity onPress={handleSubmitPost}>
                <Text style={styles.modalSubmitButton}>Post</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Media Selection */}
              <BlurView intensity={80} tint="light" style={styles.modalSection}>
                <TouchableOpacity onPress={handleSelectMedia} style={styles.mediaSelector}>
                  {selectedMedia ? (
                    <Image source={{ uri: selectedMedia }} style={styles.selectedMedia} />
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <IconButton
                        icon={modalType === 'photo' ? 'camera-plus' : 'video-plus'}
                        size={48}
                        iconColor="rgba(0,0,0,0.4)"
                      />
                      <Text style={styles.mediaPlaceholderText}>
                        Tap to capture or select {modalType}
                      </Text>
                      <Text style={styles.mediaPlaceholderSubtext}>
                        Take new • Choose from gallery
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </BlurView>

              {/* Text Input */}
              <BlurView intensity={80} tint="light" style={styles.modalSection}>
                <TextInput
                  style={styles.textInput}
                  placeholder={`What's happening with this ${modalType}?`}
                  value={postText}
                  onChangeText={setPostText}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="rgba(0,0,0,0.5)"
                />
              </BlurView>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  const renderFloatingUploadButton = () => {
    if (!isAdmin) return null;

    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '45deg'],
    });

    const optionTranslateY1 = optionsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -120],
    });

    const optionTranslateY2 = optionsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -70],
    });

    // Define theme colors for gradient combinations
    const themeColors = [
      '#ff6b35', // Orange
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#ffffff', // White
    ];
    
    // Create animated gradient colors that smoothly transition
    const animatedColor1 = colorAnim.interpolate({
      inputRange: [0, 1, 2, 3, 4],
      outputRange: [
        themeColors[0], // Orange
        themeColors[1], // Blue
        themeColors[2], // Purple
        themeColors[3], // Pink
        themeColors[4], // White
      ],
      extrapolate: 'clamp',
    });
    
    const animatedColor2 = colorAnim.interpolate({
      inputRange: [0, 1, 2, 3, 4],
      outputRange: [
        themeColors[1], // Blue (next color)
        themeColors[2], // Purple
        themeColors[3], // Pink
        themeColors[4], // White
        themeColors[0], // Orange (wrap around)
      ],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.liquidGlassContainer}>
        {/* Upload Options */}
        <Animated.View 
          style={[
            styles.uploadOption,
            {
              transform: [{ translateY: optionTranslateY1 }],
              opacity: optionsAnim,
            },
          ]}
        >
          <TouchableOpacity onPress={handleVideoUpload} activeOpacity={0.8} style={styles.optionButtonContainer}>
            <BlurView intensity={80} tint="light" style={styles.optionButton}>
              <IconButton
                icon="video"
                size={24}
                iconColor="white"
                style={styles.optionIconButton}
              />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          style={[
            styles.uploadOption,
            {
              transform: [{ translateY: optionTranslateY2 }],
              opacity: optionsAnim,
            },
          ]}
        >
          <TouchableOpacity onPress={handlePhotoUpload} activeOpacity={0.8} style={styles.optionButtonContainer}>
            <BlurView intensity={80} tint="light" style={styles.optionButton}>
              <IconButton
                icon="camera"
                size={24}
                iconColor="white"
                style={styles.optionIconButton}
              />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Liquid Glass Pool Container */}
        <View style={styles.poolContainer}>
          {/* Layer 1 */}
          <Animated.View
            style={[
              styles.poolLayer,
              {
                width: 80 * 1.5,
                height: 80 * 1.5,
                transform: [{ rotate: rotateAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }) }, { scale: 1.1 }],
              },
            ]}
          >
            <LinearGradient
              colors={[animatedColor1, animatedColor2, 'transparent']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Layer 2 */}
          <Animated.View
            style={[
              styles.poolLayer,
              {
                width: 80 * 1.3,
                height: 80 * 1.3,
                transform: [{ rotate: rotateAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['360deg', '0deg'],
                }) }, { scale: 1.05 }],
              },
            ]}
          >
            <LinearGradient
              colors={[animatedColor2, animatedColor1, 'transparent']}
              style={styles.gradient}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </Animated.View>

          {/* Layer 3 */}
          <Animated.View
            style={[
              styles.poolLayer,
              {
                width: 80 * 1.2,
                height: 80 * 1.2,
                transform: [{ rotate: rotateAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }) }],
              },
            ]}
          >
            <LinearGradient
              colors={[animatedColor1, 'rgba(255, 255, 255, 0.4)', 'transparent']}
              style={styles.gradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>


        </View>

        {/* Glass Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              width: 80 * 0.8,
              height: 80 * 0.8,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, { width: 80 * 0.8, height: 80 * 0.8 }]}
            onPress={handleUploadPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
              style={[styles.glassBackground, { width: 80 * 0.8, height: 80 * 0.8 }]}
            >
              {/* Plus Icon */}
              <Animated.View 
                style={[
                  styles.plusIcon,
                  {
                    transform: [{ rotate: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }) }],
                  }
                ]}
              >
                <View style={[styles.plusHorizontal, { width: 80 * 0.25 }]} />
                <View style={[styles.plusVertical, { height: 80 * 0.25 }]} />
              </Animated.View>

              {/* Ripple Effect */}
              <Animated.View
                style={[
                  styles.clickRipple,
                  {
                    width: 80 * 0.8,
                    height: 80 * 0.8,
                    transform: [{ scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 3],
                    }) }],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0],
                    }),
                  },
                ]}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderPostGrid = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      );
    }

    // Filter posts to show those with images OR videos
    const mediaPosts = posts.filter(post => post.image_url || post.video_url);

    if (mediaPosts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyTitle}>No Media Yet</Text>
          <Text style={styles.emptyText}>
            {isAdmin 
              ? "Start sharing photos and videos with your community by creating posts with media!"
              : "This church hasn't shared any media yet."
            }
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridContainer}>
        {mediaPosts.map((post, index) => (
          <TouchableOpacity
            key={post.id}
            style={styles.gridItem}
            onPress={() => handlePostPress(post, index)}
            activeOpacity={0.8}
          >
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.gridImage} />
            ) : (
              <View style={styles.videoThumbnail}>
                <Image source={{ uri: post.video_url }} style={styles.gridImage} />
                <View style={styles.videoPlayIcon}>
                  <IconButton
                    icon="play"
                    size={20}
                    iconColor="white"
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header with gradient accent */}
      <LinearGradient
        colors={['#ff6b35', '#8b5cf6']}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="white"
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Church Profile</Text>
          <View style={{ width: 48 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 20 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ff6b35"
            colors={['#ff6b35', '#8b5cf6']}
          />
        }
      >
          {/* Church Profile Header */}
          <View style={styles.profileHeaderContainer}>
            <BlurView intensity={80} tint="light" style={styles.profileHeader}>
              <View style={styles.profileInfo}>
              <Avatar.Text
                size={100}
                label={church?.name?.substring(0, 2) || 'CH'}
                style={styles.churchAvatar}
              />
              <Text style={styles.churchName}>
                {church?.name || 'Church Name'}
              </Text>
              <Text style={styles.churchBio}>
                {church?.bio || 'Church bio will appear here'}
              </Text>
              
              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{posts.filter(post => post.image_url).length}</Text>
                  <Text style={styles.statLabel}>Photos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{posts.filter(post => post.video_url).length}</Text>
                  <Text style={styles.statLabel}>Videos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {memberCount}
                  </Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
              </View>
              </View>
            </BlurView>
          </View>

          {/* Posts Grid */}
          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>Media</Text>
            {renderPostGrid()}
          </View>
        </ScrollView>
        
        {/* Floating Upload Button */}
        {renderFloatingUploadButton()}

      {/* Upload Modal */}
      {renderUploadModal()}

      {/* Church Profile Feed Modal */}
      {renderChurchProfileFeed()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Profile Header Container
  profileHeaderContainer: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden', // This ensures nothing bleeds outside the rounded corners
  },
  // Profile Header
  profileHeader: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileInfo: {
    padding: 24,
    alignItems: 'center',
  },
  churchAvatar: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  churchName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  churchBio: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.9)',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
  // Posts Section
  postsSection: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    marginLeft: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Grid Layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Floating Upload Button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  floatingButtonGlass: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor will be animated and passed via style prop
  },
  floatingButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  floatingButtonIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  uploadOption: {
    position: 'absolute',
    alignItems: 'center',
  },
  optionButtonContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  optionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
  },
  optionIconButton: {
    margin: 0,
    padding: 0,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalSubmitButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalSection: {
    marginVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
  },
  mediaSelector: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
  },
  selectedMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  mediaPlaceholderText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 8,
    fontWeight: '500',
  },
  mediaPlaceholderSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 4,
    fontWeight: '400',
  },
  textInput: {
    padding: 20,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.9)',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  // Church Profile Feed Styles
  profileFeedContainer: {
    flex: 1,
  },
  profileFeedGradient: {
    flex: 1,
  },
  profileFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileFeedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileFeedContent: {
    paddingBottom: 20,
  },
  feedPostContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  feedPostCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    overflow: 'hidden',
  },
  feedPostHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  feedPostAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedPostAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  feedPostAuthorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: 2,
  },
  feedPostTime: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  feedPostImage: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  feedPostVideoContainer: {
    position: 'relative',
  },
  feedPostVideoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedPostContent: {
    padding: 16,
    paddingTop: 12,
  },
  feedPostText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.9)',
    lineHeight: 22,
  },
  feedPostActions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  feedPostAction: {
    marginRight: 8,
  },
  // Liquid Glass Button Styles
  liquidGlassContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
  },
  poolContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  poolBackground1: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  poolBackground2: {
    position: 'absolute',
    top: -25,
    left: -25,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  poolBackground3: {
    position: 'absolute',
    top: -15,
    left: -15,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  poolLayer: {
    position: 'absolute',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    borderRadius: 1000,
  },
  ripple: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rippleDelay: {
    borderColor: 'rgba(0, 150, 255, 0.1)',
  },
  buttonContainer: {
    position: 'absolute',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassBackground: {
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 150, 255, 0.5)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  plusIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  plusHorizontal: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
    position: 'absolute',
  },
  plusVertical: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
    position: 'absolute',
  },
  clickRipple: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});