import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase/client';
import Logger from '../utils/logger';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  /**
   * Request permissions and register the Expo push token for the current user.
   * Call this on sign-in / app launch so the token stays fresh.
   */
  static async registerForPushNotifications(userId: string): Promise<void> {
    try {
      console.log('[Notifications] Starting registration for user:', userId);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log('[Notifications] Existing permission status:', existingStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('[Notifications] Requested permission, got:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted, aborting');
        return;
      }

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF8C00',
        });
        console.log('[Notifications] Android channel created');
      }

      console.log('[Notifications] Requesting Expo push token...');
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '36d6377d-6aab-46d3-a94a-a8c54572f21e',
      });

      const pushToken = tokenData.data;
      console.log('[Notifications] Token obtained:', pushToken);

      // Store token in profiles table
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ push_token: pushToken })
        .eq('id', userId);

      if (error) {
        console.error('[Notifications] Failed to store token:', JSON.stringify(error));
      } else {
        console.log('[Notifications] Token stored successfully');
      }
    } catch (error) {
      console.error('[Notifications] Registration failed:', error);
    }
  }

  /**
   * Notify other members of a shared list that a new item was added.
   * This is fire-and-forget — errors are logged but never thrown.
   */
  static async notifyListMembers(
    listId: string,
    currentUserId: string,
    currentUserName: string,
    itemText: string,
    listName: string,
  ): Promise<void> {
    try {
      // Get other members of this list
      const { data: members, error: membersError } = await supabase
        .from('list_members')
        .select('user_id')
        .eq('list_id', listId)
        .neq('user_id', currentUserId);

      if (membersError || !members || members.length === 0) return;

      const userIds = members.map((m: any) => m.user_id);

      // Fetch their push tokens
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('push_token')
        .in('id', userIds)
        .not('push_token', 'is', null);

      if (profilesError || !profiles || profiles.length === 0) return;

      const tokens = profiles
        .map((p: any) => p.push_token)
        .filter((t: string | null): t is string => !!t);

      if (tokens.length === 0) return;

      // Build messages
      const messages = tokens.map((token: string) => ({
        to: token,
        sound: 'default',
        title: listName,
        body: `${currentUserName} added "${itemText}"`,
      }));

      // Send via Expo push API
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      Logger.log(`Push notifications sent to ${tokens.length} member(s)`);
    } catch (error) {
      Logger.error('Failed to send push notifications:', error);
    }
  }
}
