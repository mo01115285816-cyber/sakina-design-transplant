import { PrayerTimes, Coordinates, CalculationMethod, Madhab } from "adhan";
import * as SunCalc from "suncalc";
import tzlookup from "@photostructure/tz-lookup";
import type { CalculationMethod as CalcMethodType, AsrSchool } from "./locationDetection";

export type PrayerItem = {
  key: "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
  name: string;
  time: string;
  meridiem: string;
  minutes: number;
  date?: Date;
};

export type SecondaryPrayerTimes = {
  duha: Date;
  midnight: Date;
  firstThird: Date;
  lastThird: Date;
};

// Duha begins when the sun reaches a defined post-sunrise altitude, not a fixed delay.
export const DUHA_SOLAR_ALTITUDE_DEGREES = 4.5;

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

/**
 * Resolve the IANA timezone for the selected coordinates.
 * The resolver uses current timezone boundary data and falls back to the
 * device timezone only when coordinates are invalid or unavailable.
 */
export function getTimeZoneForCoordinates(lat: number, lon: number): string {
  try {
    return tzlookup(lat, lon);
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

/**
 * Return the actual UTC offset for an IANA timezone at a specific instant.
 * This delegates DST rules to the platform's IANA tzdata instead of a
 * hand-maintained country table.
 */
export function getManualOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  if (offset === "GMT" || offset === "UTC") return 0;

  const match = offset.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  const total = hours * 60 + minutes;
  return match[1] === "-" ? -total : total;
}

/**
 * Return the Gregorian date represented by the target location's wall clock.
 * Adhan only uses the calendar date fields, so this prevents device timezone
 * differences from selecting the wrong civil day near midnight.
 */
function getCalculationDate(date: Date, timeZone: string): Date {
  const parts = getZonedParts(date, timeZone);
  return new Date(parts.year, parts.month - 1, parts.day);
}

/**
 * تحويل الأرقام الإنجليزية إلى أرقام عربية
 */
function toArabicDigits(n: number, pad: number = 2): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).padStart(pad, "0").split("").map(d => arabicDigits[parseInt(d, 10)] ?? d).join("");
}

/**
 * تنسيق الدقائق بالأرقام العربية مع ص/م
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

// Converts an instant to total local minutes from midnight at the location.
export function getLocalTimeMinutes(date: Date, lat: number, lon: number): number {
  const timeZone = getTimeZoneForCoordinates(lat, lon);
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

// Returns a Date whose UTC clock fields represent the target location's wall clock.
// This keeps countdown comparisons independent of the Android device timezone.
export function getLocalNowForCountdown(date: Date, lat: number, lon: number): Date {
  const timeZone = getTimeZoneForCoordinates(lat, lon);
  const offsetMinutes = getManualOffsetMinutes(date, timeZone);
  return new Date(date.getTime() + offsetMinutes * 60 * 1000);
}

export function formatPrayerDate(date: Date, lat: number, lon: number): { time: string; meridiem: string } {
  const roundedDate = new Date(date.getTime() + 30 * 1000);
  const timeZone = getTimeZoneForCoordinates(lat, lon);
  const parts = getZonedParts(roundedDate, timeZone);
  return formatMinutesArabic(parts.hour * 60 + parts.minute);
}

function findSolarAltitudeTime(
  sunrise: Date,
  lat: number,
  lon: number,
  altitudeDegrees: number,
): Date {
  let low = sunrise.getTime();
  let high = low + 3 * 60 * 60 * 1000;
  if (SunCalc.getPosition(new Date(high), lat, lon).altitude < altitudeDegrees) {
    return sunrise;
  }

  for (let i = 0; i < 42; i += 1) {
    const middle = Math.floor((low + high) / 2);
    const altitude = SunCalc.getPosition(new Date(middle), lat, lon).altitude;
    if (altitude >= altitudeDegrees) high = middle;
    else low = middle;
  }

  return new Date(Math.round(high / 60000) * 60000);
}

export function calculateSecondaryPrayerTimes(
  date: Date,
  lat: number,
  lon: number,
  method: CalcMethodType,
  school: AsrSchool,
): SecondaryPrayerTimes {
  const coordinates = new Coordinates(lat, lon);
  const timeZone = getTimeZoneForCoordinates(lat, lon);
  const params = getAdhanCalculationMethod(method);
  params.madhab = getAdhanMadhab(school);
  const calculationDate = getCalculationDate(date, timeZone);
  const prayerTimes = new PrayerTimes(coordinates, calculationDate, params);
  const nextDay = new Date(calculationDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayPrayerTimes = new PrayerTimes(coordinates, nextDay, params);
  const nightDuration = nextDayPrayerTimes.fajr.getTime() - prayerTimes.maghrib.getTime();
  const roundToMinute = (value: number) => new Date(Math.round(value / 60000) * 60000);

  return {
    duha: findSolarAltitudeTime(
      prayerTimes.sunrise,
      lat,
      lon,
      DUHA_SOLAR_ALTITUDE_DEGREES,
    ),
    midnight: roundToMinute(prayerTimes.maghrib.getTime() + nightDuration / 2),
    firstThird: roundToMinute(prayerTimes.maghrib.getTime() + nightDuration / 3),
    lastThird: roundToMinute(prayerTimes.maghrib.getTime() + nightDuration * (2 / 3)),
  };
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
  const timeZone = getTimeZoneForCoordinates(lat, lon);
  const params = getAdhanCalculationMethod(method);
  params.madhab = getAdhanMadhab(school);

  const adhanTimes = new PrayerTimes(
    coordinates,
    getCalculationDate(date, timeZone),
    params,
  );

  const mapPrayer = (
    key: PrayerItem["key"],
    name: string,
    timeDate: Date
  ): PrayerItem => {
    // Round astronomical output to the nearest minute, matching published
    // prayer-time references instead of truncating raw seconds.
    const roundedDate = new Date(timeDate.getTime() + 30 * 1000);
    const localParts = getZonedParts(roundedDate, timeZone);
    const localMinutes = localParts.hour * 60 + localParts.minute;
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
