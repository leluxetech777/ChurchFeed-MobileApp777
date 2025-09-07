import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Button,
  Card,
  Divider,
  FAB,
  IconButton,
  List,
  Text
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Church } from '../types';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Church[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [membersCount, setMembersCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.church_id) {
      loadBranches();
      loadStats();
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

  const loadStats = async () => {
    if (!user?.church_id) return;
    
    setLoadingStats(true);
    try {
      // Get members count for this church
      const members = await DatabaseService.getChurchMembers(user.church_id);
      setMembersCount(members.length);

      // Get posts count for this church
      const posts = await DatabaseService.getChurchFeed(user.church_id);
      setPostsCount(posts.length);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
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
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor="white" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={{ width: 48 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={[styles.content, { 
          paddingBottom: insets.bottom + 40 
        }]}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/branches')}>
            <Card style={styles.statCard} elevation={2}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>{branches.length}</Text>
                <Text style={styles.statLabel}>Branches</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/members')}>
            <Card style={styles.statCard} elevation={2}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>
                  {loadingStats ? '...' : membersCount}
                </Text>
                <Text style={styles.statLabel}>Members</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/posts')}>
            <Card style={styles.statCard} elevation={2}>
              <Card.Content style={styles.statContent}>
                <Text style={styles.statNumber}>
                  {loadingStats ? '...' : postsCount}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Management Menu */}
        <Card style={styles.menuCard} elevation={2}>
          <Card.Content style={styles.menuContent}>
            <Text style={styles.sectionTitle}>Management</Text>
            
            <List.Item
              title="Invite Admins"
              description="Add new administrators"
              left={(props) => <List.Icon {...props} icon="account-plus" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement invite admins */}}
            />
            <Divider />
            
            <List.Item
              title="Church Settings"
              description="Update church information"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement church settings */}}
            />
          </Card.Content>
        </Card>

        {/* Branches Section */}
        {branches.length > 0 && (
          <Card style={styles.branchesCard} elevation={2}>
            <Card.Content style={styles.menuContent}>
              <Text style={styles.sectionTitle}>Branches</Text>
              
              {branches.map((branch, index) => (
                <React.Fragment key={branch.id}>
                  <List.Item
                    title={branch.name}
                    description={branch.address}
                    left={(props) => <List.Icon {...props} icon="church" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => {/* TODO: Navigate to branch details */}}
                  />
                  {index < branches.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Subscription Info */}
        <Card style={styles.subscriptionCard} elevation={2}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <Text style={styles.subscriptionText}>
              Your subscription is active. Manage billing and plan details.
            </Text>
            <Button
              mode="outlined"
              onPress={() => Linking.openURL('https://billing.stripe.com/p/login/test_aFa6oJgeC8MIaHycvC5Vu00')}
              style={styles.subscriptionButton}
            >
              Manage Subscription
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
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
  scrollView: {
    flex: 1,
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
  content: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  branchesCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 80,
  },
  menuContent: {
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    padding: 16,
    paddingBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  subscriptionButton: {
    borderColor: '#ff6b35',
  },
});