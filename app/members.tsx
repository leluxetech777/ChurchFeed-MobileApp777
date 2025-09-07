import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
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
import { Member } from '../types';
import { formatDate } from '../lib/utils';

export default function MembersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.church_id) {
      loadMembers();
    }
  }, [user?.church_id]);

  const loadMembers = async () => {
    if (!user?.church_id) return;
    
    setLoading(true);
    try {
      const churchMembers = await DatabaseService.getChurchMembers(user.church_id);
      setMembers(churchMembers);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMember = ({ item }: { item: Member }) => (
    <Card style={styles.memberCard} elevation={2}>
      <Card.Content style={styles.memberContent}>
        <Avatar.Text 
          size={50} 
          label={item.name.substring(0, 2)} 
          style={styles.avatar}
        />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.memberPhone}>{item.phone}</Text>
          <Text style={styles.memberDate}>
            Joined {formatDate(item.created_at)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Members</Text>
      <Text style={styles.emptyText}>
        No members have joined this church yet. Share your church code to invite people!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Members</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading members...</Text>
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
        <Text style={styles.headerTitle}>Members ({members.length})</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          members.length === 0 && styles.listContainerEmpty
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
  memberCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  memberContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6366f1',
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  memberDate: {
    fontSize: 12,
    color: '#6366f1',
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
});