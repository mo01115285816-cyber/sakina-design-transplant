/**
 * Prayer Settings — Per-Prayer Notification Preferences
 * سكينة — إعدادات إشعارات الصلاة لكل صلاة على حدة
 */

export type PrayerNotificationMode =
  | 'beep'          // نغمة التنبيه (الافتراضي — خالية من الشبهات)
  | 'azan_short'    // صوت الأذان (مختصر/عادي)
  | 'azan_full'     // الأذان الكامل (مؤذن مخصص)
  | 'vibrate_only'  // اهتزاز فقط
  | 'silent';       // صامت

export interface MuezzinTrack {
  id: string;
  name: string;           // e.g., "علي أحمد ملا"
  url: string;            // CDN/audio URL (MP3)
  fileName: string;       // e.g., "ali_mulla_azan.mp3"
  duration?: string;      // e.g., "2:30"
  isDownloaded?: boolean;
}

export type PrayerSettingsId =
  | 'fajr'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha'
  | 'duha'
  | 'midnight'
  | 'tahajjud';

export interface SinglePrayerPreference {
  prayerId: PrayerSettingsId;
  prayerDisplayName: string;
  enabled: boolean;
  mode: PrayerNotificationMode;
  selectedMuezzinId?: string;
}

export type AllPrayersPreferences = Record<PrayerSettingsId, SinglePrayerPreference>;

/** Default preferences — all prayers beep mode, enabled */
export const DEFAULT_PRAYER_PREFERENCES: AllPrayersPreferences = {
  fajr:      { prayerId: 'fajr',      prayerDisplayName: 'الفجر',   enabled: true, mode: 'beep' },
  dhuhr:     { prayerId: 'dhuhr',     prayerDisplayName: 'الظهر',   enabled: true, mode: 'beep' },
  asr:       { prayerId: 'asr',       prayerDisplayName: 'العصر',   enabled: true, mode: 'beep' },
  maghrib:   { prayerId: 'maghrib',   prayerDisplayName: 'المغرب',  enabled: true, mode: 'beep' },
  isha:      { prayerId: 'isha',      prayerDisplayName: 'العشاء',  enabled: true, mode: 'beep' },
  duha:      { prayerId: 'duha',      prayerDisplayName: 'الضحى',   enabled: false, mode: 'beep' },
  midnight:  { prayerId: 'midnight',  prayerDisplayName: 'منتصف الليل', enabled: false, mode: 'beep' },
  tahajjud:  { prayerId: 'tahajjud',  prayerDisplayName: 'الثلث الأخير', enabled: false, mode: 'beep' },
};

/** Arabic labels for notification modes */
export const NOTIFICATION_MODE_LABELS: Record<PrayerNotificationMode, { title: string; subtitle: string }> = {
  beep:          { title: 'نغمة التنبيه',  subtitle: 'تشغيل نغمة قصيرة للتذكير.' },
  azan_short:    { title: 'صوت الأذان',     subtitle: 'تشغيل صوت الأذان.' },
  azan_full:     { title: 'الأذان الكامل',   subtitle: 'تشغيل صوت الأذان الكامل.' },
  vibrate_only:  { title: 'اهتزاز فقط',     subtitle: 'يهتز الجهاز عند وقت الصلاة دون صوت.' },
  silent:        { title: 'صامت',            subtitle: 'لن يصدر صوت لأي إشعارات.' },
};

/** Load prayer preferences from localStorage */
export function loadPrayerPreferences(): AllPrayersPreferences {
  try {
    const saved = localStorage.getItem('sakeenah_prayer_prefs');
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AllPrayersPreferences>;
      // Merge with defaults to handle new keys added in future versions
      return { ...DEFAULT_PRAYER_PREFERENCES, ...parsed };
    }
  } catch {
    // Corrupted data, use defaults
  }
  return { ...DEFAULT_PRAYER_PREFERENCES };
}

/** Save prayer preferences to localStorage */
export function savePrayerPreferences(prefs: AllPrayersPreferences): void {
  try {
    localStorage.setItem('sakeenah_prayer_prefs', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save prayer preferences:', e);
  }
}

/** Map from PrayerKey (app.types) to PrayerSettingsId */
export function prayerKeyToSettingsId(key: string): PrayerSettingsId | null {
  const mapping: Record<string, PrayerSettingsId> = {
    fajr: 'fajr',
    dhuhr: 'dhuhr',
    asr: 'asr',
    maghrib: 'maghrib',
    isha: 'isha',
  };
  return mapping[key] ?? null;
}

/** Official Halal Muezzins List — world-renowned from Makkah, Madinah, Al-Aqsa, Egypt */
export const MUEZZIN_LIST: MuezzinTrack[] = [
  { id: 'ali_mulla',           name: 'علي أحمد ملا',            url: 'https://cdn.aladhan.com/audio/adhaan/adhan_alaqsa.mp3',     fileName: 'ali_mulla_azan.mp3',         duration: '3:45' },
  { id: 'hamad_dghreri',       name: 'حمد بن أحمد الدغريري',    url: 'https://cdn.aladhan.com/audio/adhaan/adhan_makkah.mp3',    fileName: 'hamad_dghreri_azan.mp3',     duration: '3:30' },
  { id: 'ahmed_basnawi',       name: 'أحمد عبد الله بصنوي',     url: 'https://cdn.aladhan.com/audio/adhaan/adhan_makkah2.mp3',   fileName: 'ahmed_basnawi_azan.mp3',     duration: '4:00' },
  { id: 'mohammed_shaker',     name: 'محمد علي شاكر',           url: 'https://cdn.aladhan.com/audio/adhaan/adhan_makkah3.mp3',   fileName: 'mohammed_shaker_azan.mp3',   duration: '3:20' },
  { id: 'tawfiq_khoj',         name: 'توفيق خوج',               url: 'https://cdn.aladhan.com/audio/adhaan/adhan_madinah.mp3',   fileName: 'tawfiq_khoj_azan.mp3',       duration: '3:55' },
  { id: 'naif_fayda',          name: 'نايف فيده',               url: 'https://cdn.aladhan.com/audio/adhaan/adhan_madinah2.mp3',  fileName: 'naif_fayda_azan.mp3',        duration: '3:40' },
  { id: 'ahmed_nahas',         name: 'أحمد نحاس',               url: 'https://cdn.aladhan.com/audio/adhaan/adhan_egypt.mp3',     fileName: 'ahmed_nahas_azan.mp3',       duration: '3:15' },
  { id: 'majed_abbas',         name: 'ماجد العباس',              url: 'https://cdn.aladhan.com/audio/adhaan/adhan_egypt2.mp3',    fileName: 'majed_abbas_azan.mp3',       duration: '3:50' },
  { id: 'ahmed_khoja',         name: 'أحمد يونس خوجه',          url: 'https://cdn.aladhan.com/audio/adhaan/adhan_makkah4.mp3',   fileName: 'ahmed_khoja_azan.mp3',       duration: '3:25' },
  { id: 'sami_rayes',          name: 'سامي عبدالرحيم ريس',      url: 'https://cdn.aladhan.com/audio/adhaan/adhan_madinah3.mp3',  fileName: 'sami_rayes_azan.mp3',        duration: '3:35' },
  { id: 'emad_baqari',         name: 'عماد بقري',               url: 'https://cdn.aladhan.com/audio/adhaan/adhan_makkah5.mp3',   fileName: 'emad_baqari_azan.mp3',       duration: '3:10' },
  { id: 'saeed_falatah',       name: 'سعيد عمر فلاته',          url: 'https://cdn.aladhan.com/audio/adhaan/adhan_madinah4.mp3',  fileName: 'saeed_falatah_azan.mp3',     duration: '3:45' },
  { id: 'hussein_shahat',      name: 'حسين شحات',               url: 'https://cdn.aladhan.com/audio/adhaan/adhan_makkah6.mp3',   fileName: 'hussein_shahat_azan.mp3',    duration: '3:20' },
  { id: 'mohammed_omari',      name: 'محمد العمري',             url: 'https://cdn.aladhan.com/audio/adhaan/adhan_madinah5.mp3',  fileName: 'mohammed_omari_azan.mp3',    duration: '3:30' },
  { id: 'hashim_saqqaf',       name: 'هاشم السقاف',              url: 'https://cdn.aladhan.com/audio/adhaan/adhan_alaqsa2.mp3',   fileName: 'hashim_saqqaf_azan.mp3',     duration: '3:55' },
];
