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
      return null;
    }

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }

  static scheduleReminders(): void {
    this.clearScheduledReminders();
    
    const settings = StorageService.getSettings();
    if (!settings.remindersEnabled || !this.hasPermission()) {
      return;
    }

    const scheduleNext = () => {
      const intervalMs = settings.intervalMinutes * 60 * 1000;
      
      this.timeoutId = setTimeout(() => {
        this.showNotification(
          'Time for your physio routine!',
          'Tap to view your exercises and mark as complete.'
        );
        
        // Schedule the next reminder
        scheduleNext();
      }, intervalMs);

      // Update next scheduled time
      const nextTime = new Date(Date.now() + intervalMs);
      StorageService.saveSettings({ nextScheduledAt: nextTime });
    };

    scheduleNext();
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