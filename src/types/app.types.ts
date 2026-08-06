export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

export type TabType = "main" | "azkar" | "quran" | "sakeenah-ai" | "settings";

export type AzkarCounterType = "morning" | "evening" | "sleep" | "post_prayer" | "hisn";

export type WeatherData = {
  temp: number;
  conditionCode: number;
  isDay: boolean;
};
