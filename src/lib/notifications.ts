import { StorageService } from './storage';

export class NotificationService {
  private static timeoutId: NodeJS.Timeout | null = null;

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  static showNotification(title: string, body: string, actions?: { title: string; action: string }[]): Notification | null {
    if (!this.hasPermission()) {
      console.log('No notification permission');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        silent: false,
        tag: 'physio-reminder' // Prevents duplicate notifications
      });

      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

      // Auto-close after 30 seconds if not interacted with
      setTimeout(() => {
        notification.close();
      }, 30000);

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  static scheduleReminders(): void {
    this.clearScheduledReminders();
    
    const settings = StorageService.getSettings();
    if (!settings.remindersEnabled || !this.hasPermission()) {
      console.log('Reminders not enabled or no permission');
      return;
    }

    const scheduleNext = () => {
      const intervalMs = settings.intervalMinutes * 60 * 1000;
      const nextTime = new Date(Date.now() + intervalMs);
      
      console.log('Scheduling next reminder for:', nextTime);
      
      this.timeoutId = setTimeout(() => {
        console.log('Showing notification at:', new Date());
        
        // Show the notification
        const notification = this.showNotification(
          'Time for your physio routine!',
          'Tap to view your exercises and mark as complete.'
        );
        
        if (notification) {
          console.log('Notification shown successfully');
        } else {
          console.log('Failed to show notification');
        }
        
        // Schedule the next reminder
        scheduleNext();
      }, intervalMs);

      // Update next scheduled time
      StorageService.saveSettings({ nextScheduledAt: nextTime });
    };

    // Check if we have a scheduled time that already passed
    const currentSettings = StorageService.getSettings();
    const now = new Date();
    
    if (currentSettings.nextScheduledAt && currentSettings.nextScheduledAt <= now) {
      // Time has passed, trigger notification immediately and schedule next
      console.log('Scheduled time has passed, triggering immediately');
      this.showNotification(
        'Time for your physio routine!',
        'Tap to view your exercises and mark as complete.'
      );
      scheduleNext();
    } else if (currentSettings.nextScheduledAt && currentSettings.nextScheduledAt > now) {
      // We have a future scheduled time, schedule for that time
      const timeUntilNext = currentSettings.nextScheduledAt.getTime() - now.getTime();
      console.log('Resuming existing schedule, time until next:', timeUntilNext / 1000, 'seconds');
      
      this.timeoutId = setTimeout(() => {
        console.log('Showing resumed notification at:', new Date());
        
        const notification = this.showNotification(
          'Time for your physio routine!',
          'Tap to view your exercises and mark as complete.'
        );
        
        if (notification) {
          console.log('Resumed notification shown successfully');
        }
        
        // Continue with regular scheduling
        scheduleNext();
      }, timeUntilNext);
    } else {
      // No existing schedule, start fresh
      scheduleNext();
    }
  }

  static clearScheduledReminders(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    StorageService.saveSettings({ nextScheduledAt: undefined });
  }

  static scheduleSnooze(): void {
    const settings = StorageService.getSettings();
    if (!this.hasPermission()) return;

    const snoozeMs = settings.snoozeMinutes * 60 * 1000;
    
    setTimeout(() => {
      this.showNotification(
        'Physio reminder (snoozed)',
        'Time for your physio routine! This is your snoozed reminder.'
      );
    }, snoozeMs);
  }

  static getNextReminderTime(): Date | null {
    const settings = StorageService.getSettings();
    return settings.nextScheduledAt || null;
  }
}