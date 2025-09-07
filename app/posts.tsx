import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  IconButton,
  ActivityIndicator,
  Avatar
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Post } from '../types';
import { formatDate } from '../lib/utils';

export default function PostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.church_id) {
      loadPosts();
    }
  }, [user?.church_id]);

  const loadPosts = async () => {
    if (!user?.church_id) return;
    
    setLoading(true);
    try {
      const churchPosts = await DatabaseService.getChurchFeed(user.church_id);
      setPosts(churchPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostPress = (post: Post) => {
    // Navigate back to feed and scroll to specific post
    router.push({
      pathname: '/feed',
      params: { focusPostId: post.id }
    });
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)} activeOpacity={0.7}>
      <Card style={styles.postCard} elevation={2}>
        <Card.Content style={styles.postContent}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <Avatar.Text 
              size={40} 
              label={item.author?.name?.substring(0, 2) || 'CH'} 
              style={styles.avatar}
            />
            <View style={styles.postMeta}>
              <Text style={styles.authorName}>
                {item.author?.name || 'Church Admin'}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.authorRole}>
                  {item.author?.role || 'Admin'}
                </Text>
                <Text style={styles.postTime}>
                  • {formatDate(item.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Post Content */}
          <Text style={styles.postText}>{item.content}</Text>

          {/* Post Image */}
          {item.image_url && (
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          )}

          {/* Target Info for HQ posts */}
          {item.target_branches && item.target_branches.length > 0 && (
            <View style={styles.targetInfo}>
              <Text style={styles.targetText}>
                📍 Sent to selected branches
              </Text>
            </View>
          )}

          {/* Tap indicator */}
          <View style={styles.tapIndicator}>
            <Text style={styles.tapIndicatorText}>Tap to view in feed</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Posts</Text>
      <Text style={styles.emptyText}>
        No posts have been created yet. Start engaging with your community by creating your first post!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Posts</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Posts ({posts.length})</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          posts.length === 0 && styles.listContainerEmpty
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
  },
  listContainerEmpty: {
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
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  tapIndicator: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  tapIndicatorText: {
    fontSize: 12,
    color: '#6366f1',
    fontStyle: 'italic',
  },
});