import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { AllPrayersPreferences, PrayerSettingsId, PrayerNotificationMode } from '@/types/prayer-settings';
import { prayerKeyToSettingsId } from '@/types/prayer-settings';

export class PrayerNotificationsService {
  static isSupported(): boolean {
    return Capacitor.isPluginAvailable('LocalNotifications');
  }

  // 1. طلب الإذن (يُستدعى عند بدء التطبيق)
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('Local Notifications are not supported on this platform.');
      return false;
    }
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return true;
      if (current.display === 'denied') return false;

      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (e) {
      console.warn('Failed to request notification permissions:', e);
      return false;
    }
  }

  // 2. إلغاء جميع الإشعارات المجدولة لتفادي التكرار
  static async clearAllScheduled() {
    if (!this.isSupported()) return;
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (e) {
      console.warn("Error clearing scheduled notifications:", e);
    }
  }

  /**
   * Resolve notification config based on per-prayer preference mode.
   * Returns the appropriate channelId, sound, and extra settings.
   */
  private static resolveNotificationConfig(
    mode: PrayerNotificationMode,
    enabled: boolean
  ): { channelId: string; sound: string | null; extra?: Record<string, unknown> } {
    // If disabled or silent: no sound, no channel
    if (!enabled || mode === 'silent') {
      return { channelId: 'beep_channel', sound: null };
    }

    switch (mode) {
      case 'beep':
        return { channelId: 'beep_channel', sound: 'beep.wav' };
      case 'azan_short':
        // Short azan - uses default azan.wav from res/raw/
        return { channelId: 'azan_channel', sound: 'azan.wav' };
      case 'azan_full':
        // Full azan - uses default azan_full.wav from res/raw/ (if exists)
        // Falls back to azan.wav if azan_full.wav is not available
        return { channelId: 'azan_channel', sound: 'azan_full.wav' };
      case 'vibrate_only':
        return {
          channelId: 'beep_channel',
          sound: null,
          extra: { vibrationPattern: [0, 500, 200, 500] },
        };
      default:
        return { channelId: 'beep_channel', sound: 'beep.wav' };
    }
  }

  /**
   * 3. جدولة تذكير قبل الصلاة (10 دقائق) — ALWAYS enabled
   * On native Android: Uses PrePrayerReminderPlugin for live Chronometer countdown
   * On web: Falls back to static LocalNotification
   */
  static async schedulePrePrayerReminder(
    prayerName: string,
    prayerTime: Date,
    _verseText: string,
    _prayerPrefs?: AllPrayersPreferences,
    prayerKey?: string
  ) {
    if (!this.isSupported()) return;

    const reminderTime = new Date(prayerTime.getTime() - 10 * 60 * 1000);
    if (reminderTime.getTime() <= Date.now()) return;

    // Use the native Chronometer plugin on Android (live countdown)
    if (prayerKey) {
      try {
        const { PrayerAlarmService } = await import('./PrayerAlarmService');
        const scheduled = await PrayerAlarmService.schedulePrayer(prayerKey as any, prayerName, prayerTime.getTime());
        if (scheduled) return; // Success on native, no need for fallback
      } catch (e) {
        console.warn(`PrePrayerReminder plugin failed, falling back to static:`, e);
      }
    }

    // Fallback: static notification for web or if plugin fails
    try {
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
    } catch (e) {
      console.warn(`Failed to schedule pre-prayer reminder for ${prayerName}:`, e);
    }
  }

  /**
   * Prayer notification body texts — 6 spiritual reflections per prayer
   * Random selection ensures variety in each notification
   */
  private static readonly PRAYER_NOTIFICATION_BODIES: Record<string, string[]> = {
    fajr: [
      'وقرآن الفجر إن قرآن الفجر كان مشهوداً.',
      'ركعتا الفجر خير من الدنيا وما فيها.',
      'في ذمة الله وحفظه من صلى الفجر.',
      'قام القانتون؛ صلاتك نور يومك وبداية فلاحك.',
      'تجارة الصادقين والجرعة الأولى لسلامك النفسي اليوم.',
      'نُور يومك وبداية فلاحك، "وقرآن الفجر إن قرآن الفجر كان مشهوداً".',
    ],
    dhuhr: [
      'اترك مشاغل الدنيا، لتقف خاشعاً بين يدي الرحمن.',
      'ساعة تُفتح فيها أبواب السماء، فأقبل بطاعتك.',
      'الصلاة ميزان العمل، جدد طاقتك الروحية الآن.',
      'انقطع عن الأرض لتتصل بالسماء، أرح قلبك.',
      'طهر قلبك ونفسك وسط يومك المزدحم بالصلاة.',
      'فيها تُترك مشاغل الدنيا، لتقف خاشعًا بين يدي الرحمن.',
    ],
    asr: [
      '"حافظوا على الصلوات والصلاة الوسطى." امتثل لأمر ربك.',
      'من صلّى البردين (الفجر والعصر) دخل الجنة.',
      '"من صلى البردين دخل الجنة." بوابتك لنعيم دائم.',
      'صلاة العصر ميزان الخواتيم، فاجعل ختام نهارك طاعة.',
      'شمس النهار أوشكت على الغروب، أدرك صلاة الأبرار.',
      'حصن عصرك، فلا تدع أجر الصلاة الوسطى يفوتك.',
    ],
    maghrib: [
      'انطوت صفحة نهارك، فاختمها بأحب الأعمال لله.',
      'شكرٌ على يومٍ مضى، واستقبالٌ لليلٍ يقبل بالقبول.',
      'سارع للخيرات وأدرك الأجر، صلاة المغرب نداء الطمأنينة.',
      'غربت الشمس ويبقى وجه ربك، قف واشكر نعمه.',
      'خلوة المساء الأولى، أرح بها بدنك المتعب من الدنيا.',
      'اجعل أولى خطوات ليلك بين يدي الرحمن، واختم نهارك بذكره.',
    ],
    isha: [
      '"من صلى العشاء في جماعة فكأنما قام نصف الليل."',
      'محطة السكينة بعد عناء يومك، اختم يومك بطاعة.',
      '"لو يعلمون ما في العتمة لأتوهما ولو حبواً."',
      'نم طاهراً قرير العين، واجعل العشاء آخر عهدك.',
      'نداء الهدوء والصلة الأخيرة بربك، قف بين يديه.',
      'محطة السكينة بعد عناء يومك، أرح قلبك بلقاء ربك واختم يومك بطاعة.',
    ],
  };

  /**
   * Randomly select a spiritual reflection text for the given prayer
   * 100% random selection — no fixed order, no sequential pattern
   */
  private static getRandomPrayerText(prayerKey: string): string {
    const texts = this.PRAYER_NOTIFICATION_BODIES[prayerKey];
    if (!texts || texts.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * texts.length);
    return texts[randomIndex];
  }

  /**
   * 4. إشعار عند موعد الصلاة — with per-prayer mode support
   */
  static async schedulePrayerTime(
    prayerName: string,
    prayerTime: Date,
    _verseText: string,
    prayerPrefs?: AllPrayersPreferences,
    prayerKey?: string
  ) {
    if (!this.isSupported()) return;

    // Resolve preference for this prayer
    let mode: PrayerNotificationMode = 'beep';
    let enabled = true;

    if (prayerPrefs && prayerKey) {
      const settingsId = prayerKeyToSettingsId(prayerKey);
      if (settingsId && prayerPrefs[settingsId]) {
        mode = prayerPrefs[settingsId].mode;
        enabled = prayerPrefs[settingsId].enabled;
      }
    }

    // If disabled: don't schedule
    if (!enabled) return;

    const bodyText = prayerKey ? this.getRandomPrayerText(prayerKey) : '';
    const notificationTitle = `آن أوان صلاة ${prayerName}`;

    // If silent mode: still schedule (shows notification silently)
    if (mode === 'silent') {
      if (prayerTime.getTime() <= Date.now()) return;
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000) + 1000000,
              title: notificationTitle,
              body: bodyText,
              schedule: { at: prayerTime },
              sound: null,
              channelId: 'beep_channel',
              actionTypeId: 'PRAYER_TIME',
            }
          ]
        });
      } catch (e) {
        console.warn(`Failed to schedule silent prayer time for ${prayerName}:`, e);
      }
      return;
    }

    if (prayerTime.getTime() <= Date.now()) return;

    const config = this.resolveNotificationConfig(mode, enabled);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000) + 1000000,
            title: notificationTitle,
            body: bodyText,
            schedule: { at: prayerTime },
            sound: config.sound,
            channelId: config.channelId,
            actionTypeId: 'PRAYER_TIME',
            ...config.extra,
          }
        ]
      });
    } catch (e) {
      console.warn(`Failed to schedule prayer time notification for ${prayerName}:`, e);
    }
  }

  // 5. إشعار تجريبي فوري لتسهيل التحقق والتحكم
  static async scheduleTestNotification(): Promise<boolean> {
    if (!this.isSupported()) {
      // Browser Web Fallback
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("سَكِينَة - إشعار تجريبي", {
            body: "تم تفعيل الإشعارات بنجاح في تطبيق سَكِينَة. تقبل الله طاعاتكم.",
          });
          return true;
        } else if (Notification.permission !== "denied") {
          const result = await Notification.requestPermission();
          if (result === "granted") {
            new Notification("سَكِينَة - إشعار تجريبي", {
              body: "تم تفعيل الإشعارات بنجاح في تطبيق سَكِينَة. تقبل الله طاعاتكم.",
            });
            return true;
          }
        }
      }
      return false;
    }
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 999999,
            title: "سَكِينَة - إشعار تجريبي",
            body: "تم تفعيل الإشعارات بنجاح في تطبيق سَكِينَة. تقبل الله طاعاتكم.",
            schedule: { at: new Date(Date.now() + 1000) },
            sound: "azan.wav",
            channelId: "azan_channel",
            actionTypeId: "TEST_NOTIFICATION",
          }
        ]
      });
      return true;
    } catch (e) {
      console.warn("Failed to schedule test notification:", e);
      return false;
    }
  }

  // Helper to calculate the next occurrence of a HH:MM string
  private static calculateNextOccurrence(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  // 6. جدولة تذكير سورة الملك
  static async scheduleMulkReminder(targetTimeStr: string) {
    if (!this.isSupported()) return;
    const targetDate = this.calculateNextOccurrence(targetTimeStr);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 888881,
            title: "تذكير سورة الملك",
            body: "حان الآن وقت قراءة سورة الملك المنجية من عذاب القبر.",
            schedule: { at: targetDate },
            sound: 'beep.wav',
            channelId: 'beep_channel',
            actionTypeId: 'MULK_REMINDER',
          }
        ]
      });
    } catch (e) {
      console.warn("Failed to schedule Surah Al-Mulk reminder:", e);
    }
  }

  // 7. جدولة تذكير سورة البقرة
  static async scheduleBaqarahReminder(targetTimeStr: string) {
    if (!this.isSupported()) return;
    const targetDate = this.calculateNextOccurrence(targetTimeStr);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 888882,
            title: "تذكير سورة البقرة",
            body: "حان الآن وقت قراءة سورة البقرة المباركة.",
            schedule: { at: targetDate },
            sound: 'beep.wav',
            channelId: 'beep_channel',
            actionTypeId: 'BAQARAH_REMINDER',
          }
        ]
      });
    } catch (e) {
      console.warn("Failed to schedule Surah Al-Baqarah reminder:", e);
    }
  }

  /**
   * 8. جدولة إشعار للأوقات الثانوية (الضحى، منتصف الليل، الثلث الأخير)
   */
  static async scheduleSecondaryPrayerNotification(
    prayerId: PrayerSettingsId,
    prayerName: string,
    prayerTime: Date,
    prefs: AllPrayersPreferences
  ) {
    if (!this.isSupported()) return;

    const pref = prefs[prayerId];
    if (!pref || !pref.enabled) return;
    if (prayerTime.getTime() <= Date.now()) return;

    const config = this.resolveNotificationConfig(pref.mode, pref.enabled);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1000000),
            title: `حان الآن وقت ${prayerName}`,
            body: `حان الآن وقت ${prayerName}. تقبل الله طاعاتكم.`,
            schedule: { at: prayerTime },
            sound: config.sound,
            channelId: config.channelId,
            actionTypeId: 'SPIRITUAL_REMINDER',
            ...config.extra,
          }
        ]
      });
    } catch (e) {
      console.warn(`Failed to schedule ${prayerName} notification:`, e);
    }
  }
}
