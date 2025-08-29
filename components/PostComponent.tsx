import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard
} from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  IconButton, 
  Chip,
  Divider,
  ActivityIndicator
} from 'react-native-paper';
import { Post } from '../types';
import { formatDate } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface PostComponentProps {
  post: Post;
  onReaction?: (postId: string, reactionType: string) => Promise<void>;
  onComment?: (postId: string, comment: string) => Promise<void>;
  onShare?: (post: Post) => void;
}

const REACTION_EMOJIS = {
  like: '👍',
  love: '❤️',
  pray: '🙏',
  amen: '🙌'
};

const REACTION_LABELS = {
  like: 'Like',
  love: 'Love',
  pray: 'Pray',
  amen: 'Amen'
};

export default function PostComponent({ 
  post, 
  onReaction, 
  onComment, 
  onShare 
}: PostComponentProps) {
  const { user, currentMember } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const currentUser = user?.admin || currentMember;
  const userName = currentUser?.name || 'Anonymous';

  const handleReaction = async (reactionType: string) => {
    if (!onReaction) return;
    
    try {
      await onReaction(post.id, reactionType);
      setShowReactionPicker(false);
    } catch {
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !onComment) return;
    
    setIsCommenting(true);
    try {
      await onComment(post.id, newComment.trim());
      setNewComment('');
      Keyboard.dismiss();
    } catch {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const getTopReactions = () => {
    if (!post.reaction_counts) return [];
    
    return Object.entries(post.reaction_counts)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));
  };

  const getTotalReactions = () => {
    if (!post.reaction_counts) return 0;
    return Object.values(post.reaction_counts).reduce((sum, count) => sum + count, 0);
  };

  const topReactions = getTopReactions();
  const totalReactions = getTotalReactions();

  return (
    <Card style={styles.postCard} elevation={2}>
      <Card.Content style={styles.postContent}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Avatar.Text 
            size={45} 
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
              <Chip 
                mode="outlined" 
                compact 
                style={styles.churchChip}
                textStyle={styles.chipText}
              >
                📍 {post.church.name}
              </Chip>
            )}
          </View>
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => {}}
          />
        </View>

        {/* Post Content */}
        <Text style={styles.postText}>{post.content}</Text>

        {/* Post Image */}
        {post.image_url && (
          <TouchableOpacity activeOpacity={0.9}>
            <Image 
              source={{ uri: post.image_url }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Target Info for HQ posts */}
        {post.target_branches && post.target_branches.length > 0 && (
          <View style={styles.targetInfo}>
            <Text style={styles.targetText}>
              📍 Sent to selected branches
            </Text>
          </View>
        )}

        {/* Reaction Summary */}
        {totalReactions > 0 && (
          <View style={styles.reactionSummary}>
            <View style={styles.reactionEmojis}>
              {topReactions.map(({ type }) => (
                <Text key={type} style={styles.reactionEmoji}>
                  {REACTION_EMOJIS[type as keyof typeof REACTION_EMOJIS]}
                </Text>
              ))}
            </View>
            <Text style={styles.reactionCount}>
              {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
            </Text>
            {post.comment_count && post.comment_count > 0 && (
              <Text style={styles.commentCount}>
                {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
              </Text>
            )}
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              post.user_reaction && styles.actionButtonActive
            ]}
            onPress={() => setShowReactionPicker(!showReactionPicker)}
          >
            <Text style={[
              styles.actionButtonText,
              post.user_reaction && styles.actionButtonTextActive
            ]}>
              {post.user_reaction ? 
                REACTION_EMOJIS[post.user_reaction as keyof typeof REACTION_EMOJIS] : '👍'
              } {post.user_reaction ? 
                REACTION_LABELS[post.user_reaction as keyof typeof REACTION_LABELS] : 'Like'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={toggleComments}
          >
            <Text style={styles.actionButtonText}>💬 Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onShare?.(post)}
          >
            <Text style={styles.actionButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        {/* Reaction Picker */}
        {showReactionPicker && (
          <View style={styles.reactionPicker}>
            {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
              <TouchableOpacity
                key={type}
                style={styles.reactionOption}
                onPress={() => handleReaction(type)}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
                <Text style={styles.reactionOptionLabel}>
                  {REACTION_LABELS[type as keyof typeof REACTION_LABELS]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            <Divider style={styles.divider} />
            
            {/* Add Comment */}
            <View style={styles.addComment}>
              <Avatar.Text 
                size={32} 
                label={userName.substring(0, 2)} 
                style={styles.commentAvatar}
              />
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#94a3b8"
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                {newComment.trim().length > 0 && (
                  <TouchableOpacity 
                    style={styles.commentSubmit}
                    onPress={handleComment}
                    disabled={isCommenting}
                  >
                    {isCommenting ? (
                      <ActivityIndicator size={16} color="#6366f1" />
                    ) : (
                      <Text style={styles.commentSubmitText}>Post</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Comments List */}
            {post.comments && post.comments.length > 0 && (
              <View style={styles.commentsList}>
                {post.comments.slice(0, 3).map((comment) => (
                  <View key={comment.id} style={styles.comment}>
                    <Avatar.Text 
                      size={28} 
                      label={comment.user_name.substring(0, 2)} 
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentContent}>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthor}>
                          {comment.user_name}
                          {comment.user_role && (
                            <Text style={styles.commentRole}> • {comment.user_role}</Text>
                          )}
                        </Text>
                        <Text style={styles.commentText}>{comment.content}</Text>
                      </View>
                      <Text style={styles.commentTime}>
                        {formatDate(comment.created_at)}
                      </Text>
                    </View>
                  </View>
                ))}
                
                {post.comments.length > 3 && (
                  <TouchableOpacity style={styles.viewMoreComments}>
                    <Text style={styles.viewMoreText}>
                      View {post.comments.length - 3} more comments
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  postCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 0,
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
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
    marginBottom: 6,
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
  churchChip: {
    alignSelf: 'flex-start',
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1e293b',
    marginBottom: 16,
  },
  postImage: {
    width: '100%',
    height: Math.min(width * 0.75, 400),
    borderRadius: 8,
    marginBottom: 12,
  },
  targetInfo: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  targetText: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  reactionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  reactionEmojis: {
    flexDirection: 'row',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    marginLeft: 8,
  },
  commentCount: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#e2e8f0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#f0f9ff',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  actionButtonTextActive: {
    color: '#6366f1',
  },
  reactionPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 8,
  },
  reactionOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reactionOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  reactionOptionLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  commentsSection: {
    marginTop: 8,
  },
  addComment: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    backgroundColor: '#94a3b8',
    marginRight: 8,
  },
  commentInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    maxHeight: 100,
  },
  commentSubmit: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  commentSubmitText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  commentsList: {
    paddingTop: 8,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    marginLeft: 4,
  },
  commentBubble: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  commentRole: {
    fontWeight: '400',
    color: '#6366f1',
  },
  commentText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 12,
  },
  viewMoreComments: {
    paddingVertical: 8,
    paddingLeft: 40,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
});