import { Capacitor } from '@capacitor/core';

/**
 * AdhanPlayerService — React bridge to the native AdhanPlayerService.
 *
 * This service is called when prayer time arrives to play the adhan audio.
 * It supports:
 * - Default azan sound (azan.wav from res/raw)
 * - Custom muezzin audio (downloaded via MuezzinSelectorSection)
 * - STOP action via notification button
 * - Automatic stop when audio finishes
 *
 * Usage:
 * - Call playAdhan() when the Exact Alarm fires for prayer time
 * - Call stopAdhan() when user taps STOP
 */

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface AdhanPlayerOptions {
  prayerKey: PrayerKey;
  prayerName: string;
  notificationBody: string;
  muezzinUri?: string; // URI of downloaded muezzin audio file
}

class AdhanPlayerServiceImpl {
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
      this.plugin = (window as any).AdhanPlayer || null;
      if (!this.plugin) {
        const Plugins = (window as any).Capacitor?.Plugins;
        this.plugin = Plugins?.AdhanPlayer || null;
      }
    } catch (e) {
      console.warn('AdhanPlayer plugin not available:', e);
    }
  }

  private callPlugin(method: string, args: Record<string, any> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        if (this.plugin && typeof this.plugin[method] === 'function') {
          this.plugin[method](args).then(resolve).catch(reject);
        } else {
          Capacitor.nativePromise('AdhanPlayer', method, args).then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Play the adhan audio for a specific prayer.
   * Shows a notification with STOP button.
   *
   * @param options Prayer details and optional muezzin URI
   * @returns true if adhan started playing successfully
   */
  async playAdhan(options: AdhanPlayerOptions): Promise<boolean> {
    if (!this.isNative) {
      console.warn('AdhanPlayerService: Not on native Android');
      return false;
    }

    try {
      const result = await this.callPlugin('playAdhan', {
        prayerKey: options.prayerKey,
        prayerName: options.prayerName,
        notificationBody: options.notificationBody,
        muezzinUri: options.muezzinUri || null,
      });
      return result?.success ?? false;
    } catch (e) {
      console.warn('AdhanPlayerService.playAdhan failed:', e);
      return false;
    }
  }

  /**
   * Stop the adhan audio and cancel the notification.
   *
   * @param prayerKey Prayer key to stop
   * @returns true if stopped successfully
   */
  async stopAdhan(prayerKey: PrayerKey): Promise<boolean> {
    if (!this.isNative) return false;

    try {
      const result = await this.callPlugin('stopAdhan', { prayerKey });
      return result?.success ?? false;
    } catch (e) {
      console.warn('AdhanPlayerService.stopAdhan failed:', e);
      return false;
    }
  }
}

export const AdhanPlayerService = new AdhanPlayerServiceImpl();
