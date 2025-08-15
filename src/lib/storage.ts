export interface Exercise {
  id: string;
  name: string;
  note?: string;
  position: number;
}

export interface CompletionEvent {
  id: string;
  timestamp: Date;
  source: 'notification' | 'manual';
}

export interface Settings {
  remindersEnabled: boolean;
  intervalMinutes: number;
  snoozeMinutes: number;
  nextScheduledAt?: Date;
  themePreference: 'system' | 'light' | 'dark';
}

const STORAGE_KEYS = {
  EXERCISES: 'physio_exercises',
  COMPLETIONS: 'physio_completions',
  SETTINGS: 'physio_settings'
} as const;

// Default settings
const DEFAULT_SETTINGS: Settings = {
  remindersEnabled: false,
  intervalMinutes: 120, // 2 hours
  snoozeMinutes: 10,
  themePreference: 'system'
};

export class StorageService {
  static getExercises(): Exercise[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXERCISES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveExercises(exercises: Exercise[]): void {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
  }

  static getCompletions(): CompletionEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      const completions = stored ? JSON.parse(stored) : [];
      // Convert timestamp strings back to Date objects
      return completions.map((c: any) => ({
        ...c,
        timestamp: new Date(c.timestamp)
      }));
    } catch {
      return [];
    }
  }

  static addCompletion(source: 'notification' | 'manual' = 'manual'): void {
    const completions = this.getCompletions();
    const newCompletion: CompletionEvent = {
      id: `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      source
    };
    completions.push(newCompletion);
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(completions));
  }

  static getSettings(): Settings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
      // Convert nextScheduledAt string back to Date object if it exists
      if (settings.nextScheduledAt) {
        settings.nextScheduledAt = new Date(settings.nextScheduledAt);
      }
      return { ...DEFAULT_SETTINGS, ...settings };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: Partial<Settings>): void {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  }

  // Stats calculations
  static getStats() {
    const completions = this.getCompletions();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayCount = completions.filter(c => c.timestamp >= today).length;
    const sevenDayCount = completions.filter(c => c.timestamp >= sevenDaysAgo).length;
    const allTimeCount = completions.length;

    return {
      today: todayCount,
      sevenDays: sevenDayCount,
      allTime: allTimeCount
    };
  }
}