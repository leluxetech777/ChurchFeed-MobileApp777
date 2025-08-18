import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { DatabaseService } from './database';

export class NotificationService {
  static async initialize() {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the token
    const token = await this.getExpoPushToken();
    return token;
  }

  static async getExpoPushToken() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      // Try to get token without explicit projectId first (Expo Go)
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.warn('Push notifications not available in Expo Go:', error.message);
      // In Expo Go, push notifications have limitations
      console.warn('For full push notification support, use a development build instead of Expo Go.');
      return null;
    }
  }

  static async registerMemberForNotifications(memberId: string) {
    try {
      const token = await this.getExpoPushToken();
      if (token) {
        await DatabaseService.updateMemberDeviceToken(memberId, token);
        return token;
      }
    } catch (error) {
      console.error('Error registering member for notifications:', error);
    }
    return null;
  }

  static async sendNotificationToMembers(
    memberIds: string[], 
    title: string, 
    body: string, 
    data?: any
  ) {
    try {
      // In a real implementation, this would call your backend API
      // which would then send notifications via Expo's push service
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/send-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberIds,
          title,
          body,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  static async sendNotificationToChurch(
    churchId: string, 
    title: string, 
    body: string, 
    data?: any
  ) {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/send-church-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          churchId,
          title,
          body,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send church notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending church notification:', error);
      throw error;
    }
  }

  static async scheduleLocalNotification(
    title: string, 
    body: string, 
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger,
      });
      return id;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }

  static async cancelLocalNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling local notification:', error);
    }
  }

  static async cancelAllLocalNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all local notifications:', error);
    }
  }

  static addNotificationListener(
    handler: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(handler);
  }

  static addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }

  static removeNotificationSubscription(
    subscription: Notifications.Subscription
  ) {
    Notifications.removeNotificationSubscription(subscription);
  }

  // Helper function to create notification content for new posts
  static createPostNotification(authorName: string, churchName: string, preview: string) {
    return {
      title: `New announcement from ${churchName}`,
      body: `${authorName}: ${preview.length > 50 ? preview.substring(0, 50) + '...' : preview}`,
      data: {
        type: 'new_post',
        churchName,
        authorName,
      },
    };
  }

  // Helper function to create notification for administrative updates
  static createAdminNotification(title: string, message: string, type: string) {
    return {
      title,
      body: message,
      data: {
        type: `admin_${type}`,
      },
    };
  }
}

// Configuration for different Android notification channels
export const NotificationChannels = {
  ANNOUNCEMENTS: {
    id: 'announcements',
    name: 'Church Announcements',
    description: 'Notifications for new church announcements',
    importance: Notifications.AndroidImportance.HIGH,
    sound: true,
    vibrate: true,
  },
  ADMIN: {
    id: 'admin',
    name: 'Administrative',
    description: 'Administrative notifications and updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: true,
    vibrate: false,
  },
  REMINDERS: {
    id: 'reminders',
    name: 'Reminders',
    description: 'Event and service reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: false,
    vibrate: true,
  },
};

// Function to set up notification channels on Android
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    Object.values(NotificationChannels).forEach(async (channel) => {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
        vibrationPattern: channel.vibrate ? [0, 250, 250, 250] : undefined,
      });
    });
  }
}

/* 
Sample backend API endpoints you would need to implement:

POST /send-notifications
- Takes array of member IDs and notification content
- Looks up device tokens for members
- Sends push notifications via Expo's push service
- Returns success/failure status

POST /send-church-notification  
- Takes church ID and notification content
- Finds all members of the church
- Sends notifications to all church members
- Returns delivery statistics

The backend would use Expo's push notification service:
https://docs.expo.dev/push-notifications/sending-notifications/

Example backend notification sending code:
```javascript
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotifications(notifications) {
  const chunks = expo.chunkPushNotifications(notifications);
  const tickets = [];
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending notification chunk:', error);
    }
  }
  
  return tickets;
}
```
*/