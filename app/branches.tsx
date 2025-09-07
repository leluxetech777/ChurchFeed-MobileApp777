import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Text, 
  Card, 
  IconButton,
  ActivityIndicator
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Church } from '../types';

export default function BranchesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.church_id) {
      loadBranches();
    }
  }, [user?.church_id]);

  const loadBranches = async () => {
    if (!user?.church_id) return;
    
    setLoading(true);
    try {
      const churchBranches = await DatabaseService.getChurchBranches(user.church_id);
      setBranches(churchBranches);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBranch = ({ item }: { item: Church }) => (
    <Card style={styles.branchCard} elevation={2}>
      <Card.Content style={styles.branchContent}>
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>{item.name}</Text>
          <Text style={styles.branchAddress}>{item.address}</Text>
          <Text style={styles.branchCode}>Code: {item.church_code}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏛️</Text>
      <Text style={styles.emptyTitle}>No Branches</Text>
      <Text style={styles.emptyText}>
        This church doesn't have any branches yet.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Branches</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading branches...</Text>
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
        <Text style={styles.headerTitle}>Branches ({branches.length})</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={branches}
        renderItem={renderBranch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          branches.length === 0 && styles.listContainerEmpty
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
  branchCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  branchContent: {
    padding: 16,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  branchCode: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
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