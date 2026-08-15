import { PrayerTimes, Coordinates, CalculationMethod, Madhab } from "adhan";
import type { CalculationMethod as CalcMethodType, AsrSchool } from "./locationDetection";

export type PrayerItem = {
  key: "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
  name: string;
  time: string;
  meridiem: string;
  minutes: number;
  date?: Date;
};

// Map custom UI/Location method strings to Adhan library Enum values
function getAdhanCalculationMethod(method: CalcMethodType) {
  switch (method) {
    case "EGYPTIAN":
      return CalculationMethod.Egyptian();
    case "UMM_AL_QURA":
      return CalculationMethod.UmmAlQura();
    case "ISNA":
      return CalculationMethod.NorthAmerica();
    case "KARACHI":
      return CalculationMethod.Karachi();
    case "MWL":
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

// Map custom UI Asr school to Adhan Madhab
function getAdhanMadhab(school: AsrSchool) {
  return school === "HANAFI" ? Madhab.Hanafi : Madhab.Shafi;
}

// ═══════════════════════════════════════════════════════════════
// القاعدة #6: حساب DST يدوياً — لا تعتمد على Intl.DateTimeFormat مع timeZone
// لأن tzdata النظام على أجهزة أندرويد قديمة (7-10) قد لا يعرف DST 2026 لمصر
// ═══════════════════════════════════════════════════════════════

/**
 * حساب DST المصري يدوياً (بدون Intl أو tzdata)
 * Egypt DST 2023+:
 *   - Starts: last Friday of April (00:00 local)
 *   - Ends:   last Thursday of October (00:00 local)
 *   - Summer: UTC+3
 *   - Winter: UTC+2
 */
function isEgyptDSTActive(date: Date): boolean {
  const year = date.getUTCFullYear();

  // Find last Friday of April
  let lastFridayApril = new Date(Date.UTC(year, 3, 30));
  while (lastFridayApril.getUTCDay() !== 5) { // 5 = Friday
    lastFridayApril.setUTCDate(lastFridayApril.getUTCDate() - 1);
  }
  // The legal transition is at 00:00 local standard time (UTC+2).
  const dstStart = Date.UTC(year, 3, lastFridayApril.getUTCDate(), 0, 0, 0) - 2 * 60 * 60 * 1000;

  // Find last Thursday of October
  let lastThursdayOctober = new Date(Date.UTC(year, 9, 31));
  while (lastThursdayOctober.getUTCDay() !== 4) { // 4 = Thursday
    lastThursdayOctober.setUTCDate(lastThursdayOctober.getUTCDate() - 1);
  }
  // DST remains active through the last Thursday and ends at 00:00 local
  // on the following day (UTC+3 while the transition is evaluated).
  const dstEnd = Date.UTC(year, 9, lastThursdayOctober.getUTCDate() + 1, 0, 0, 0) - 3 * 60 * 60 * 1000;

  return date.getTime() >= dstStart && date.getTime() < dstEnd;
}

/**
 * Resolve the app's supported timezone approximation from coordinates.
 * The same mapping is used for prayer formatting and countdown state.
 */
export function getTimeZoneForCoordinates(lat: number, lon: number): string {
  if (lon >= 24 && lon <= 37 && lat >= 22 && lat <= 32) return "Africa/Cairo";
  if (lon >= 34 && lon <= 56 && lat >= 16 && lat <= 33) return "Asia/Riyadh";
  if (lon >= 25 && lon <= 45 && lat >= 36 && lat <= 42) return "Europe/Istanbul";
  if (lon >= 60 && lon <= 78 && lat >= 23 && lat <= 37) return "Asia/Karachi";
  if (lon >= 68 && lon <= 90 && lat >= 6 && lat <= 36) return "Asia/Kolkata";
  if (lon >= -8 && lon <= 2 && lat >= 49 && lat <= 61) return "Europe/London";
  if (lon >= -5 && lon <= 15 && lat >= 42 && lat <= 55) return "Europe/Paris";
  if (lon >= -125 && lon <= -65 && lat >= 25 && lat <= 50) return "America/New_York";
  return "UTC";
}

/**
 * حساب offset يدوي لكل timezone (بالدقائق من UTC)
 * هذا يضمن دقة التوقيت على كل الأجهزة (Android 7.0+)
 */
export function getManualOffsetMinutes(date: Date, timeZone: string): number {
  switch (timeZone) {
    case "Africa/Cairo":
      return isEgyptDSTActive(date) ? 180 : 120; // +3h summer, +2h winter
    case "Asia/Riyadh":
    case "Asia/Dubai":
    case "Asia/Kuwait":
    case "Asia/Bahrain":
    case "Asia/Qatar":
      return 180; // UTC+3, no DST
    case "Europe/Istanbul":
      return 180; // UTC+3, no DST since 2016
    case "Asia/Karachi":
      return 300; // UTC+5
    case "Asia/Kolkata":
      return 330; // UTC+5:30
    case "Asia/Dhaka":
      return 360; // UTC+6
    case "Asia/Jakarta":
      return 420; // UTC+7
    case "Asia/Kuala_Lumpur":
      return 480; // UTC+8
    case "Europe/London":
      // UK DST: last Sunday of March to last Sunday of October
      return isUKDSTActive(date) ? 60 : 0;
    case "Europe/Paris":
    case "Europe/Berlin":
    case "Europe/Madrid":
    case "Europe/Rome":
      return isEUDSTActive(date) ? 120 : 60; // CET/CEST
    case "America/New_York":
      return isUSDSTActive(date) ? -240 : -300; // EST/EDT
    case "America/Chicago":
      return isUSDSTActive(date) ? -300 : -360; // CST/CDT
    case "America/Denver":
      return isUSDSTActive(date) ? -360 : -420; // MST/MDT
    case "America/Los_Angeles":
      return isUSDSTActive(date) ? -420 : -480; // PST/PDT
    default:
      return 0; // Fallback to UTC
  }
}

function isUKDSTActive(date: Date): boolean {
  const year = date.getUTCFullYear();
  const dstStart = getLastSundayOfMonth(year, 2, 1); // March, 01:00 UTC
  const dstEnd = getLastSundayOfMonth(year, 9, 1);   // October, 01:00 UTC
  return date.getTime() >= dstStart && date.getTime() < dstEnd;
}

function isEUDSTActive(date: Date): boolean {
  const year = date.getUTCFullYear();
  const dstStart = getLastSundayOfMonth(year, 2, 1); // March, 01:00 UTC
  const dstEnd = getLastSundayOfMonth(year, 9, 1);   // October, 01:00 UTC
  return date.getTime() >= dstStart && date.getTime() < dstEnd;
}

function isUSDSTActive(date: Date): boolean {
  const year = date.getUTCFullYear();
  const dstStart = getSecondSundayOfMonth(year, 2, 7); // March, 07:00 UTC (02:00 local standard)
  const dstEnd = getFirstSundayOfMonth(year, 10, 6);   // November, 06:00 UTC (02:00 local daylight)
  return date.getTime() >= dstStart && date.getTime() < dstEnd;
}

function getLastSundayOfMonth(year: number, month: number, hourUTC: number): number {
  let d = new Date(Date.UTC(year, month + 1, 0)); // Last day of month
  while (d.getUTCDay() !== 0) { // 0 = Sunday
    d.setUTCDate(d.getUTCDate() - 1);
  }
  d.setUTCHours(hourUTC, 0, 0, 0);
  return d.getTime();
}

function getSecondSundayOfMonth(year: number, month: number, hourUTC: number): number {
  let d = new Date(Date.UTC(year, month, 1));
  let sundayCount = 0;
  while (sundayCount < 2) {
    if (d.getUTCDay() === 0) sundayCount++;
    if (sundayCount < 2) d.setUTCDate(d.getUTCDate() + 1);
  }
  d.setUTCHours(hourUTC, 0, 0, 0);
  return d.getTime();
}

function getFirstSundayOfMonth(year: number, month: number, hourUTC: number): number {
  let d = new Date(Date.UTC(year, month, 1));
  while (d.getUTCDay() !== 0) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  d.setUTCHours(hourUTC, 0, 0, 0);
  return d.getTime();
}

/**
 * تحويل الأرقام الإنجليزية إلى أرقام عربية
 */
function toArabicDigits(n: number, pad: number = 2): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).padStart(pad, "0").split("").map(d => arabicDigits[parseInt(d, 10)] ?? d).join("");
}

/**
 * تنسيق الدقائق بالأرقام العربية مع ص/م (بدون Intl.DateTimeFormat)
 * القاعدة #6: حساب يدوي باستخدام getUTCHours() + manualOffset
 */
function formatMinutesArabic(minutes: number): { time: string; meridiem: string } {
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours < 12 ? "ص" : "م";
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  return {
    time: `${toArabicDigits(hours12)}:${toArabicDigits(mins)}`,
    meridiem: ampm,
  };
}

// Helper: Converts a Date to total local minutes from midnight, using local timezone
export function getLocalTimeMinutes(date: Date, lat: number, lon: number): number {
  const locationNow = getLocalNowForCountdown(date, lat, lon);
  return locationNow.getUTCHours() * 60 + locationNow.getUTCMinutes();
}

// Returns a Date whose UTC clock fields represent the target location's wall clock.
// This keeps countdown comparisons independent of the Android device timezone.
export function getLocalNowForCountdown(date: Date, lat: number, lon: number): Date {
  const timeZone = getTimeZoneForCoordinates(lat, lon);
  const offsetMinutes = getManualOffsetMinutes(date, timeZone);
  return new Date(date.getTime() + offsetMinutes * 60 * 1000);
}

// Core function to calculate prayer times for any coordinate/date
export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lon: number,
  method: CalcMethodType,
  school: AsrSchool
): PrayerItem[] {
  const coordinates = new Coordinates(lat, lon);
  const params = getAdhanCalculationMethod(method);
  params.madhab = getAdhanMadhab(school);

  const adhanTimes = new PrayerTimes(coordinates, date, params);

  /**
   * القاعدة #6: حساب DST يدوياً
   * نحسب offset يدوياً بناءً على الموقع الجغرافي
   * ثم نستخدم getUTCHours() + offset بدلاً من Intl.DateTimeFormat
   */
  const mapPrayer = (
    key: PrayerItem["key"],
    name: string,
    timeDate: Date
  ): PrayerItem => {
    // حساب الدقائق يدوياً باستخدام UTC + manual offset
    const utcMinutes = timeDate.getUTCHours() * 60 + timeDate.getUTCMinutes();

    const timeZone = getTimeZoneForCoordinates(lat, lon);
    const offsetMinutes = getManualOffsetMinutes(timeDate, timeZone);
    let localMinutes = utcMinutes + offsetMinutes;
    localMinutes = ((localMinutes % 1440) + 1440) % 1440; // handle day wrap

    const formatted = formatMinutesArabic(localMinutes);

    return {
      key,
      name,
      time: formatted.time,
      meridiem: formatted.meridiem,
      minutes: localMinutes,
      date: timeDate,
    };
  };

  return [
    mapPrayer("fajr", "الفجر", adhanTimes.fajr),
    mapPrayer("sunrise", "الشروق", adhanTimes.sunrise),
    mapPrayer("dhuhr", "الظهر", adhanTimes.dhuhr),
    mapPrayer("asr", "العصر", adhanTimes.asr),
    mapPrayer("maghrib", "المغرب", adhanTimes.maghrib),
    mapPrayer("isha", "العشاء", adhanTimes.isha),
  ];
}
