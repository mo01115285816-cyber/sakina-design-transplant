import { Capacitor, registerPlugin } from '@capacitor/core';

const NativePrePrayerReminder = registerPlugin<Record<string, (args: Record<string, unknown>) => Promise<unknown>>>("PrePrayerReminder");

/**
 * PrePrayerReminderService — React bridge to the native Android
 * PrePrayerReminderPlugin which builds Chronometer countdown notifications.
 *
 * On native Android: Uses the native plugin for live countdown notifications
 * On web/browser: Falls back to Capacitor LocalNotifications (static notification)
 *
 * This service replaces the old approach of using LocalNotifications for
 * pre-prayer reminders with a far superior live countdown experience.
 */

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

class PrePrayerReminderServiceImpl {
  private isNative: boolean;
  private plugin: any = null;

  constructor() {
    this.isNative = this.checkNative();
    if (this.isNative) this.initPlugin();
  }

  private checkNative(): boolean {
    try {
      return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    } catch {
      return false;
    }
  }

  private async initPlugin() {
    try {
      this.plugin = (window as any).PrePrayerReminder || null;
      if (!this.plugin) {
        const Plugins = (window as any).Capacitor?.Plugins;
        this.plugin = Plugins?.PrePrayerReminder || null;
      }
    } catch (e) {
      console.warn('PrePrayerReminder plugin not available:', e);
    }
  }

  private callPlugin(method: string, args: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.plugin && typeof this.plugin[method] === 'function') {
          this.plugin[method](args).then(resolve).catch(reject);
        } else {
          const nativeMethod = NativePrePrayerReminder[method];
          if (!nativeMethod) throw new Error(`PrePrayerReminder method not found: ${method}`);
          nativeMethod(args).then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Schedule a live Chronometer countdown notification for a pre-prayer reminder.
   *
   * On native Android:
   *   - Shows a live ticking countdown (MM:SS format) from 10:00 → 00:00
   *   - Cannot be dismissed by user (ongoing)
   *   - Auto-cancels at prayer time via setTimeoutAfter(10min)
   *   - Appears as Status Chip / Live Activity on Android 12+
   *
   * On web:
   *   - Falls back to static LocalNotification
   */
  async schedule(prayerName: string, prayerKey: PrayerKey, prayerTime: Date): Promise<boolean> {
    if (!this.isNative) {
      return this.scheduleWebFallback(prayerName, prayerTime);
    }

    try {
      await this.callPlugin('schedule', {
        prayerName,
        prayerKey,
        prayerTimeMs: prayerTime.getTime(),
      });
      return true;
    } catch (e) {
      console.warn(`PrePrayerReminder.schedule failed for ${prayerName}:`, e);
      return false;
    }
  }

  /**
   * Cancel a specific pre-prayer reminder.
   */
  async cancel(prayerKey: PrayerKey, dayOfYear?: number): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const args: Record<string, any> = { prayerKey };
      if (dayOfYear !== undefined) args.dayOfYear = dayOfYear;
      await this.callPlugin('cancel', args);
      return true;
    } catch (e) {
      console.warn(`PrePrayerReminder.cancel failed for ${prayerKey}:`, e);
      return false;
    }
  }

  /**
   * Cancel ALL pre-prayer reminders (for rescheduling).
   */
  async cancelAll(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      await this.callPlugin('cancelAll');
      return true;
    } catch (e) {
      console.warn('PrePrayerReminder.cancelAll failed:', e);
      return false;
    }
  }

  /**
   * Check if live Chronometer countdown is supported on this device.
   * Requires Android 7.0+ (API 24).
   */
  async isChronometerSupported(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('isChronometerSupported');
      return result?.supported ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Web fallback: schedule a static notification using LocalNotifications.
   * Used when running in browser (PWA) where native Chronometer is unavailable.
   */
  private async scheduleWebFallback(prayerName: string, prayerTime: Date): Promise<boolean> {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      const reminderTime = new Date(prayerTime.getTime() - 10 * 60 * 1000);
      if (reminderTime.getTime() <= Date.now()) return false;

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000) + 500000,
            title: `أوشك الميقات • صلاة ${prayerName}`,
            body: 'تهيأ بوضوئك، متبقي على الأذان.',
            schedule: { at: reminderTime },
            sound: null,
            channelId: 'beep_channel',
            actionTypeId: 'PRAYER_REMINDER',
          }
        ]
      });
      return true;
    } catch (e) {
      console.warn('Web fallback pre-prayer reminder failed:', e);
      return false;
    }
  }
}

export const PrePrayerReminderService = new PrePrayerReminderServiceImpl();
