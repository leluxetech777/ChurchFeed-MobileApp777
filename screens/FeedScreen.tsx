import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  Image,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Text, 
  Card, 
  Avatar, 
  IconButton, 
  FAB,
  ActivityIndicator,
  Chip
} from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Post } from '../types';
import { formatDate } from '../lib/utils';

const { width } = Dimensions.get('window');

interface PostItemProps {
  post: Post;
}

function PostItem({ post }: PostItemProps) {
  return (
    <Card style={styles.postCard} elevation={2}>
      <Card.Content style={styles.postContent}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Avatar.Text 
            size={40} 
            label={post.author?.name?.substring(0, 2) || 'CH'} 
            style={styles.avatar}
          />
          <View style={styles.postMeta}>
            <Text style={styles.authorName}>
              {post.author?.name || 'Church Admin'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.authorRole}>
                {post.author?.role || 'Admin'}
              </Text>
              <Text style={styles.postTime}>
                • {formatDate(post.created_at)}
              </Text>
            </View>
            {post.church?.name && (
              <Text style={styles.churchName}>
                📍 {post.church.name}
              </Text>
            )}
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.postText}>{post.content}</Text>

        {/* Post Image */}
        {post.image_url && (
          <Image 
            source={{ uri: post.image_url }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* Target Info for HQ posts */}
        {post.target_branches && post.target_branches.length > 0 && (
          <View style={styles.targetInfo}>
            <Text style={styles.targetText}>
              📍 Sent to selected branches
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { user, currentMember } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const churchId = user?.church_id || currentMember?.church_id;
  const isAdmin = !!user?.admin;

  const loadPosts = async () => {
    if (!churchId) return;
    
    try {
      const fetchedPosts = await DatabaseService.getChurchFeed(churchId);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [churchId]);

  useFocusEffect(
    useCallback(() => {
      if (churchId) {
        setLoading(true);
        loadPosts();
      }
    }, [churchId])
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📢</Text>
      <Text style={styles.emptyTitle}>No announcements yet</Text>
      <Text style={styles.emptyText}>
        {isAdmin 
          ? "You haven't posted any announcements yet. Tap the + button to create your first post!"
          : "Your church hasn't posted any announcements yet. Check back soon!"
        }
      </Text>
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <PostItem post={item} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Church Feed</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <IconButton
                icon="account-group"
                size={24}
                iconColor="white"
                onPress={() => router.push('/admin-dashboard')}
              />
            )}
            <IconButton
              icon="account-circle"
              size={24}
              iconColor="white"
              onPress={() => router.push('/profile')}
            />
          </View>
        </View>

        {/* Feed */}
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.feedContainer,
            posts.length === 0 && styles.feedContainerEmpty
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#ff6b35']}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />

        {/* Bottom Blur Overlay for Engagement */}
        <LinearGradient
          colors={[
            'transparent', 
            'rgba(255, 255, 255, 0.2)', 
            'rgba(255, 255, 255, 0.6)', 
            'rgba(255, 255, 255, 0.9)', 
            'rgba(255, 255, 255, 1.0)'
          ]}
          style={styles.bottomBlur}
          pointerEvents="none"
        />

      </LinearGradient>

      {/* Create Post FAB (Admin Only) - Outside gradient to avoid blur interference */}
      {isAdmin && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/create-post')}
          label="Post"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    zIndex: 300, // Above everything including blur
    elevation: 300, // For Android
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  feedContainer: {
    padding: 16,
  },
  feedContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  postCard: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#6366f1',
    marginRight: 12,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorRole: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  postTime: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  churchName: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  targetInfo: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  targetText: {
    fontSize: 12,
    color: '#0369a1',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280, // Increased height
    zIndex: 100, // Above posts, below buttons
    elevation: 100, // For Android
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#ff6b35',
    zIndex: 9999, // Maximum z-index
    elevation: 9999, // Maximum elevation for Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
});