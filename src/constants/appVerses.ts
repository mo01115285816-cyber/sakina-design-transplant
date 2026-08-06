/**
 * Central registry of Quranic verses displayed across the app (outside the Quran reader).
 * These fonts are pre-loaded at app startup so verses render instantly with no flash.
 *
 * Each entry maps a verse to its QCF page font + word range,
 * matching the data in public/data/mushaf/page-XXX.json (zonetecde/mushaf-layout dataset).
 */

export interface AppVerse {
  /** Page number in the Madani Mushaf (1-604) — determines which QCF font to load */
  pageNumber: number;
  /** Verse key in "surah:verse" format */
  verseKey: string;
  /** Word position range within the verse (1-based, inclusive) */
  wordStart: number;
  wordEnd: number;
  /** Human-readable source label */
  source: string;
}

export const APP_VERSES = {
  /** SplashScreen: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا" */
  splash: {
    pageNumber: 95,
    verseKey: "4:103",
    wordStart: 14,
    wordEnd: 20,
    source: "سورة النساء • الآية ١٠٣",
  },
  /** Home page — Fajr & Maghrib share the same verse 17:78 */
  fajr: {
    pageNumber: 290,
    verseKey: "17:78",
    wordStart: 8,
    wordEnd: 14,
    source: "سورة الإسراء 78",
  },
  maghrib: {
    pageNumber: 290,
    verseKey: "17:78",
    wordStart: 1,
    wordEnd: 7,
    source: "سورة الإسراء 78",
  },
  /** Home page — Asr: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ" */
  asr: {
    pageNumber: 39,
    verseKey: "2:238",
    wordStart: 1,
    wordEnd: 5,
    source: "سورة البقرة 238",
  },
  /** Home page — Isha: "وَمِنَ اللَّيْلِ فَسَبِّحْهُ وَأَدْبَارَ السُّجُودِ" */
  isha: {
    pageNumber: 520,
    verseKey: "50:40",
    wordStart: 1,
    wordEnd: 5,
    source: "سورة ق 40",
  },
  /** SettingsScreen: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" */
  settings: {
    pageNumber: 252,
    verseKey: "13:28",
    wordStart: 7,
    wordEnd: 11,
    source: "سورة الرعد - الآية ٢٨",
  },
} as const;

/**
 * Unique page numbers that need QCF fonts preloaded at app startup.
 * Deduplicated set — 17:78 (fajr) and 17:78 (maghrib) share page 290.
 */
export const PRELOAD_QCF_PAGES: number[] = Array.from(
  new Set(Object.values(APP_VERSES).map((v) => v.pageNumber))
);
