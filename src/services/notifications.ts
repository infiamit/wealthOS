import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up default notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Create notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streak-reminders', {
      name: 'Daily Streak Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#39FF14',
    });
  }

  return finalStatus === 'granted';
}

/**
 * Schedule a local push notification to remind the user to complete their story
 * to keep their streak alive.
 * 
 * @param streakCount - The current active streak number
 */
export async function scheduleStreakReminder(streakCount: number): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    // 1. Clear any previously scheduled streak notifications first to avoid cluttering
    await cancelAllStreakReminders();

    // 2. Request permissions (fails silently if already determined or denied)
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // 3. Schedule next reminder for 24 hours from now
    const triggerSeconds = 24 * 60 * 60; // 24 hours

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Keep Your Compounding Streak Alive!',
        body: streakCount > 0 
          ? `Your active streak is at ${streakCount} days. Play today's dilemma to keep the flame burning!`
          : `Make your first financial decision today and start compiling your daily streak!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        android: {
          channelId: 'streak-reminders',
        },
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn('Failed to schedule streak notification reminder:', error);
    return null;
  }
}

/**
 * Cancel any scheduled streak reminders
 */
export async function cancelAllStreakReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Failed to cancel notifications:', e);
  }
}
