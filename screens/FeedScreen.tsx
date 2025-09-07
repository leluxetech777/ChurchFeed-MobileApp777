import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  FAB,
  IconButton,
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { DatabaseService } from '../services/database';
import { Post, PostReaction, ReactionType } from '../types';

const { width } = Dimensions.get('window');

interface PostItemProps {
  post: Post;
  currentUserId?: string;
  onReactionPress: (postId: string, reactionType: ReactionType) => void;
  isHighlighted?: boolean;
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  like: '👍',
  prayer: '🙏',
  praise: '🙌',
  heart_hands: '🫶',
};

function PostItem({ post, currentUserId, onReactionPress, isHighlighted }: PostItemProps) {
  const [reactions, setReactions] = useState<PostReaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReactions();
  }, [post.id, currentUserId]);

  const loadReactions = async () => {
    setLoading(true);
    try {
      const postReactions = await DatabaseService.getPostReactions(post.id, currentUserId);
      setReactions(postReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactionPress = async (reactionType: ReactionType) => {
    if (!currentUserId) return;
    
    onReactionPress(post.id, reactionType);
    
    // Optimistically update local state for single-reaction logic
    setReactions(prev => {
      const currentUserReaction = prev.find(r => r.userReacted);
      const targetReaction = prev.find(r => r.type === reactionType);
      
      if (currentUserReaction && currentUserReaction.type === reactionType) {
        // User is removing their current reaction
        return prev.map(r => 
          r.type === reactionType 
            ? { ...r, count: Math.max(0, r.count - 1), userReacted: false }
            : r
        ).filter(r => r.count > 0);
      } else {
        // User is changing to a new reaction or adding first reaction
        let newReactions = [...prev];
        
        // Remove old reaction if exists
        if (currentUserReaction) {
          newReactions = newReactions.map(r => 
            r.type === currentUserReaction.type 
              ? { ...r, count: Math.max(0, r.count - 1), userReacted: false }
              : r
          ).filter(r => r.count > 0);
        }
        
        // Add/update new reaction
        const existingTarget = newReactions.find(r => r.type === reactionType);
        if (existingTarget) {
          newReactions = newReactions.map(r => 
            r.type === reactionType 
              ? { ...r, count: r.count + 1, userReacted: true }
              : r
          );
        } else {
          newReactions.push({ type: reactionType, count: 1, userReacted: true });
        }
        
        return newReactions;
      }
    });
  };

  return (
    <View style={[styles.postCard, isHighlighted && styles.postCardHighlighted]}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorSection}>
            <LinearGradient
              colors={['#ff6b35', '#8b5cf6']}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {post.author?.name?.substring(0, 2) || 'CH'}
              </Text>
            </LinearGradient>
            <View style={styles.authorInfo}>
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
        </View>

        {/* Post Content */}
        <View style={styles.contentSection}>
          <Text style={styles.postText}>{post.content}</Text>

          {/* Post Image */}
          {post.image_url && (
            <View style={styles.mediaContainer}>
              <Image 
                source={{ uri: post.image_url }} 
                style={styles.postMedia}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Target Info for HQ posts */}
          {post.target_branches && post.target_branches.length > 0 && (
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>
                📍 Sent to selected branches
              </Text>
            </View>
          )}
        </View>

        {/* Engagement Section */}
        <View style={styles.engagementSection}>
          <View style={styles.reactionButtons}>
            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => {
              const reactionType = type as ReactionType;
              const reaction = reactions.find(r => r.type === reactionType);
              const isActive = reaction?.userReacted || false;
              const hasCount = reaction && reaction.count > 0;
              
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reactionChip,
                    isActive && styles.reactionChipActive,
                    !hasCount && styles.reactionChipEmpty
                  ]}
                  onPress={() => handleReactionPress(reactionType)}
                  disabled={!currentUserId}
                >
                  <Text style={[
                    styles.reactionEmoji,
                    isActive && styles.reactionEmojiActive
                  ]}>{emoji}</Text>
                  {hasCount && (
                    <Text style={[
                      styles.reactionCount,
                      isActive && styles.reactionCountActive
                    ]}>
                      {reaction.count}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { focusPostId } = useLocalSearchParams<{ focusPostId?: string }>();
  const { user, currentMember } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const churchId = user?.church_id || currentMember?.church_id;
  const isAdmin = !!user?.admin;
  const currentUserId = user?.id || currentMember?.user_id;

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

  // Effect to scroll to specific post when focusPostId is provided
  useEffect(() => {
    if (focusPostId && posts.length > 0 && !loading) {
      const postIndex = posts.findIndex(post => post.id === focusPostId);
      if (postIndex !== -1 && flatListRef.current) {
        // Highlight the post
        setHighlightedPostId(focusPostId);
        
        // Small delay to ensure the list is fully rendered
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: postIndex,
            animated: true,
            viewPosition: 0.1 // Show the post near the top
          });
        }, 100);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedPostId(null);
        }, 3000);
      }
    }
  }, [focusPostId, posts, loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [churchId]);

  const handleReactionPress = async (postId: string, reactionType: ReactionType) => {
    if (!currentUserId) return;

    try {
      // Check if user already has this reaction selected
      const postReactions = await DatabaseService.getPostReactions(postId, currentUserId);
      const currentUserReaction = postReactions.find(r => r.userReacted);

      if (currentUserReaction && currentUserReaction.type === reactionType) {
        // User is removing their current reaction
        await DatabaseService.removeReaction(postId, currentUserId);
      } else {
        // User is setting a new reaction (will replace any existing one)
        await DatabaseService.setReaction(postId, currentUserId, reactionType);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

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
    <PostItem 
      post={item} 
      currentUserId={currentUserId}
      onReactionPress={handleReactionPress}
      isHighlighted={highlightedPostId === item.id}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#ff6b35', '#8b5cf6', '#3b82f6', '#ffffff']}
          style={styles.gradient}
        >
          <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Loading feed...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Church Feed</Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="church"
              size={24}
              iconColor="white"
              onPress={() => router.push('/church-profile')}
            />
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

      </LinearGradient>
      
      {/* Feed */}
      <FlatList
          ref={flatListRef}
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
          onScrollToIndexFailed={(info) => {
            // Fallback if scrollToIndex fails
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.1
              });
            });
          }}
        />


      {/* Create Post FAB (Admin Only) */}
      {isAdmin && (
        <LinearGradient
          colors={['#ff6b35', '#8b5cf6']}
          style={[styles.fabGradient, { bottom: insets.bottom + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => router.push('/create-post')}
            label="Post"
            mode="elevated"
          />
        </LinearGradient>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    backgroundColor: '#f8fafc',
  },
  feedContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // Modern Post Card
  postCard: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  postCardHighlighted: {
    borderColor: '#ff6b35',
    shadowColor: '#ff6b35',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  postHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  churchName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  contentSection: {
    paddingHorizontal: 16,
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1e293b',
    marginBottom: 12,
  },
  mediaContainer: {
    marginTop: 8,
    marginBottom: 12,
    marginHorizontal: -16,
  },
  postMedia: {
    width: '100%',
    height: 280,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  targetBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  targetInfo: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  targetText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
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
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  fabGradient: {
    position: 'absolute',
    right: 16,
    borderRadius: 28,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    backgroundColor: 'transparent',
    margin: 0,
  },
  engagementSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reactionChipActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#ff6b35',
  },
  reactionChipEmpty: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e7eb',
  },
  reactionEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  reactionEmojiActive: {
    transform: [{ scale: 1.1 }],
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textShadowRadius: 1,
  },
  reactionCountActive: {
    color: '#ff6b35',
  },
});