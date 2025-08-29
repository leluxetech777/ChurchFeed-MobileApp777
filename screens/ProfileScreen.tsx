import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Avatar, 
  List,
  Divider,
  IconButton
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, currentMember, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/welcome');
          }
        },
      ]
    );
  };

  const userInfo = user?.admin || currentMember;
  const isAdmin = !!user?.admin;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info Card */}
        <Card style={styles.userCard} elevation={2}>
          <Card.Content style={styles.userCardContent}>
            <Avatar.Text 
              size={80} 
              label={userInfo?.name?.substring(0, 2) || 'U'} 
              style={styles.avatar}
            />
            <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
            <Text style={styles.userRole}>
              {isAdmin ? user.admin?.role : 'Member'}
            </Text>
            <Text style={styles.userEmail}>{userInfo?.email}</Text>
            {userInfo?.phone && (
              <Text style={styles.userPhone}>{userInfo.phone}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard} elevation={2}>
          <Card.Content style={styles.menuContent}>
            {isAdmin && (
              <>
                <List.Item
                  title="Admin Dashboard"
                  description="Manage church and members"
                  left={(props) => <List.Icon {...props} icon="view-dashboard" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push('/admin-dashboard')}
                />
                <Divider />
                <List.Item
                  title="Subscription"
                  description="Manage billing and plans"
                  left={(props) => <List.Icon {...props} icon="credit-card" />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => Linking.openURL('https://billing.stripe.com/p/login/test_aFa6oJgeC8MIaHycvC5Vu00')}
                />
                <Divider />
              </>
            )}
            
            <List.Item
              title="Notifications"
              description="Manage notification preferences"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement notification settings */}}
            />
            <Divider />
            
            <List.Item
              title="Help & Support"
              description="Get help and contact support"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement help/support */}}
            />
            <Divider />
            
            <List.Item
              title="About"
              description="App version and information"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {/* TODO: Implement about screen */}}
            />
          </Card.Content>
        </Card>

        {/* Sign Out Button */}
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.signOutButton}
          labelStyle={styles.signOutButtonLabel}
          buttonColor="#ef4444"
        >
          Sign Out
        </Button>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>ChurchFeed v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 ChurchFeed</Text>
        </View>
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
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
  },
  userCardContent: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 24,
  },
  menuContent: {
    padding: 0,
  },
  signOutButton: {
    marginBottom: 24,
    paddingVertical: 8,
    borderRadius: 25,
  },
  signOutButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#94a3b8',
  },
});