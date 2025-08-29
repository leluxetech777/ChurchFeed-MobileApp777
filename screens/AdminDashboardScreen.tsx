import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  List,
  Divider,
  IconButton,
  FAB
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../services/database';
import { Church } from '../types';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Church[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{branches.length}</Text>
              <Text style={styles.statLabel}>Branches</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Members</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard} elevation={2}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </Card.Content>
          </Card>
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
              title="Manage Members"
              description="View and manage church members"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement member management */}}
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

      {/* Create Post FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/create-post')}
        label="Post"
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
  content: {
    flexGrow: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
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
    color: '#6366f1',
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
    borderColor: '#6366f1',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6366f1',
  },
});