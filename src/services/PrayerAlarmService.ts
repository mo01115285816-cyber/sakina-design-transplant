import { Capacitor, registerPlugin } from '@capacitor/core';

const NativePrayerAlarm = registerPlugin<Record<string, (args: Record<string, unknown>) => Promise<unknown>>>("PrayerAlarm");

/**
 * PrayerAlarmService — React bridge to the native PrayerAlarmPlugin.
 *
 * This service replaces the unreliable Capacitor LocalNotifications with
 * native Android Exact Alarms (AlarmManager.setExactAndAllowWhileIdle).
 *
 * Features:
 * - Survives Doze Mode and Deep Sleep
 * - Survives App Standby Buckets
 * - Survives device reboots (via BootReceiver)
 * - 24-Hour Refresh Chain prevents Android from archiving the app
 * - Battery Optimization Bypass for long-term reliability (> 1 week)
 *
 * Usage:
 * - Call scheduleAllPrayers() when app starts or prayer times change
 * - Call requestExactAlarmPermission() on Android 12+ (first run)
 * - Call requestIgnoreBatteryOptimization() for long-term reliability
 * - Call openAutoStartSettings() on Xiaomi/OPPO/Vivo devices
 */

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface PrayerSchedule {
  key: PrayerKey;
  name: string;
  timeMs: number;
}

class PrayerAlarmServiceImpl {
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
      this.plugin = (window as any).PrayerAlarm || null;
      if (!this.plugin) {
        const Plugins = (window as any).Capacitor?.Plugins;
        this.plugin = Plugins?.PrayerAlarm || null;
      }
    } catch (e) {
      console.warn('PrayerAlarm plugin not available:', e);
    }
  }

  private callPlugin(method: string, args: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.plugin && typeof this.plugin[method] === 'function') {
          this.plugin[method](args).then(resolve).catch(reject);
        } else {
          const nativeMethod = NativePrayerAlarm[method];
          if (!nativeMethod) throw new Error(`PrayerAlarm method not found: ${method}`);
          nativeMethod(args).then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Schedule all prayers for today using Exact Alarms.
   * This is the PRIMARY scheduling method — replaces LocalNotifications.
   *
   * @param prayers Array of {key, name, timeMs} objects
   * @returns true if all prayers were scheduled successfully
   */
  async scheduleAllPrayers(prayers: PrayerSchedule[]): Promise<boolean> {
    if (!this.isNative) {
      console.warn('PrayerAlarmService: Not on native Android — using fallback');
      return false;
    }

    try {
      const result = await this.callPlugin('scheduleAllPrayers', { prayers });
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.scheduleAllPrayers failed:', e);
      return false;
    }
  }

  /**
   * Schedule a single prayer alarm.
   *
   * @param prayerKey Prayer key (fajr, dhuhr, asr, maghrib, isha)
   * @param prayerName Arabic name (e.g., "الفجر")
   * @param prayerTimeMs Prayer time in milliseconds (epoch)
   * @returns true if scheduled successfully
   */
  async schedulePrayer(prayerKey: PrayerKey, prayerName: string, prayerTimeMs: number): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('schedulePrayer', {
        prayerKey,
        prayerName,
        prayerTimeMs,
      });
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.schedulePrayer failed:', e);
      return false;
    }
  }

  /**
   * Cancel ALL scheduled prayer alarms.
   * Use this before rescheduling (e.g., when location changes).
   */
  async cancelAll(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('cancelAll');
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.cancelAll failed:', e);
      return false;
    }
  }

  /**
   * Check if SCHEDULE_EXACT_ALARM permission is granted.
   * Required on Android 12+ (API 31).
   *
   * @returns true if permission is granted
   */
  async canScheduleExactAlarms(): Promise<boolean> {
    if (!this.isNative) return true; // Not required on web/older Android

    try {
      const result = await this.callPlugin('canScheduleExactAlarms');
      return result?.canSchedule ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.canScheduleExactAlarms failed:', e);
      return false;
    }
  }

  /**
   * Open system settings to grant SCHEDULE_EXACT_ALARM permission.
   * Must be called on Android 12+ before scheduling exact alarms.
   */
  async requestExactAlarmPermission(): Promise<boolean> {
    if (!this.isNative) return true;

    try {
      const result = await this.callPlugin('requestExactAlarmPermission');
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.requestExactAlarmPermission failed:', e);
      return false;
    }
  }

  /**
   * Check if battery optimization is enabled for this app.
   * If true, the app WILL be killed by the system after a few days.
   *
   * @returns true if battery optimization is ACTIVE (bad)
   */
  async isBatteryOptimizationEnabled(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('isBatteryOptimizationEnabled');
      return result?.enabled ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.isBatteryOptimizationEnabled failed:', e);
      return false;
    }
  }

  /**
   * Request battery optimization bypass.
   * Opens system settings for user to approve.
   * Once approved, the app is whitelisted permanently.
   *
   * @returns true if the settings page was opened
   */
  async requestIgnoreBatteryOptimization(): Promise<boolean> {
    if (!this.isNative) return true;

    try {
      const result = await this.callPlugin('requestIgnoreBatteryOptimization');
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.requestIgnoreBatteryOptimization failed:', e);
      return false;
    }
  }

  /**
   * Open manufacturer-specific auto-start settings.
   * CRITICAL for Xiaomi (MIUI), OPPO (ColorOS), Vivo (FuntouchOS), Samsung.
   * Without this, the app will be killed even with Battery Optimization Bypass.
   *
   * @returns true if the settings page was opened
   */
  async openAutoStartSettings(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('openAutoStartSettings');
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.openAutoStartSettings failed:', e);
      return false;
    }
  }

  /**
   * Check if running on an aggressive manufacturer known for killing apps.
   * Affected: Xiaomi, OPPO, Vivo, Samsung, Huawei.
   *
   * @returns true if on an aggressive manufacturer
   */
  async isAggressiveManufacturer(): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('isAggressiveManufacturer');
      return result?.isAggressive ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.isAggressiveManufacturer failed:', e);
      return false;
    }
  }

  /**
   * Save the selected muezzin ID and file name.
   * Called when user selects a muezzin in the settings.
   *
   * @param muezzinId The muezzin's unique ID
   * @param fileName The muezzin's audio file name
   * @returns true if saved successfully
   */
  async saveSelectedMuezzin(muezzinId: string, fileName: string): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('saveSelectedMuezzin', { muezzinId, fileName });
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.saveSelectedMuezzin failed:', e);
      return false;
    }
  }

  /**
   * Check if a muezzin audio file is downloaded locally.
   *
   * @param fileName The muezzin's audio file name
   * @returns true if the file exists locally
   */
  async isMuezzinDownloaded(fileName: string): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('isMuezzinDownloaded', { fileName });
      return result?.isDownloaded ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.isMuezzinDownloaded failed:', e);
      return false;
    }
  }

  /**
   * Delete a muezzin audio file.
   *
   * @param fileName The muezzin's audio file name
   * @returns true if deleted successfully
   */
  async deleteMuezzin(fileName: string): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('deleteMuezzin', { fileName });
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.deleteMuezzin failed:', e);
      return false;
    }
  }

  /**
   * Get prayer notification preferences.
   *
   * @param prayerKey Prayer key (fajr, dhuhr, asr, maghrib, isha)
   * @returns Object with enabled and mode properties
   */
  async getPrayerPreference(prayerKey: string): Promise<{ enabled: boolean; mode: string } | null> {
    if (!this.isNative) return null;

    try {
      const result = await this.callPlugin('getPrayerPreference', { prayerKey });
      return {
        enabled: result?.enabled ?? true,
        mode: result?.mode ?? 'beep',
      };
    } catch (e) {
      console.warn('PrayerAlarmService.getPrayerPreference failed:', e);
      return null;
    }
  }

  /**
   * Save prayer notification preferences.
   *
   * @param prayerKey Prayer key (fajr, dhuhr, asr, maghrib, isha)
   * @param enabled Whether the prayer notification is enabled
   * @param mode Notification mode (beep, azan_short, azan_full, vibrate_only, silent)
   * @returns true if saved successfully
   */
  async savePrayerPreference(prayerKey: string, enabled: boolean, mode: string): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('savePrayerPreference', { prayerKey, enabled, mode });
      return result?.success ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.savePrayerPreference failed:', e);
      return false;
    }
  }

  /**
   * Check if adhan should be played for a prayer.
   * Returns true only if prayer is enabled AND mode is azan_short or azan_full.
   *
   * @param prayerKey Prayer key (fajr, dhuhr, asr, maghrib, isha)
   * @returns true if adhan should be played
   */
  async shouldPlayAdhan(prayerKey: string): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('shouldPlayAdhan', { prayerKey });
      return result?.shouldPlayAdhan ?? false;
    } catch (e) {
      console.warn('PrayerAlarmService.shouldPlayAdhan failed:', e);
      return false;
    }
  }
}

export const PrayerAlarmService = new PrayerAlarmServiceImpl();
