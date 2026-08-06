import { PrayerKey } from "@/types/app.types";
import type { CalculationMethod, AsrSchool } from "@/utils/locationDetection";
import { APP_VERSES } from "./appVerses";

export const backgrounds: Record<PrayerKey, string> = {
  fajr: "./images/prayers/fajr.jpg",
  sunrise: "./images/prayers/sunrise.jpg",
  dhuhr: "./images/prayers/dhuhr.jpg",
  asr: "./images/prayers/asr.jpg",
  maghrib: "./images/prayers/maghrib.jpg",
  isha: "./images/prayers/isha.jpg",
};

interface Reflection {
  text: string;
  source: string;
  isQuran: boolean;
  qcf?: {
    verseKey: string;
    pageNumber: number;
    wordStart: number;
    wordEnd: number;
  };
}

export const prayerReflections: Record<PrayerKey, Reflection> = {
  fajr: {
    text: "وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا",
    source: APP_VERSES.fajr.source,
    isQuran: true,
    qcf: {
      verseKey: APP_VERSES.fajr.verseKey,
      pageNumber: APP_VERSES.fajr.pageNumber,
      wordStart: APP_VERSES.fajr.wordStart,
      wordEnd: APP_VERSES.fajr.wordEnd,
    },
  },
  sunrise: {
    text: "مَن صَلَّى الصُّبْحَ فَهُوَ فِي ذِمَّةِ اللَّهِ",
    source: "رواه مسلم",
    isQuran: false,
  },
  dhuhr: {
    text: "الصَّلَاةُ نُورٌ",
    source: "رواه مسلم",
    isQuran: false,
  },
  asr: {
    text: "حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ",
    source: APP_VERSES.asr.source,
    isQuran: true,
    qcf: {
      verseKey: APP_VERSES.asr.verseKey,
      pageNumber: APP_VERSES.asr.pageNumber,
      wordStart: APP_VERSES.asr.wordStart,
      wordEnd: APP_VERSES.asr.wordEnd,
    },
  },
  maghrib: {
    text: "أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ",
    source: APP_VERSES.maghrib.source,
    isQuran: true,
    qcf: {
      verseKey: APP_VERSES.maghrib.verseKey,
      pageNumber: APP_VERSES.maghrib.pageNumber,
      wordStart: APP_VERSES.maghrib.wordStart,
      wordEnd: APP_VERSES.maghrib.wordEnd,
    },
  },
  isha: {
    text: "وَمِنَ اللَّيْلِ فَسَبِّحْهُ وَأَدْبَارَ السُّجُودِ",
    source: APP_VERSES.isha.source,
    isQuran: true,
    qcf: {
      verseKey: APP_VERSES.isha.verseKey,
      pageNumber: APP_VERSES.isha.pageNumber,
      wordStart: APP_VERSES.isha.wordStart,
      wordEnd: APP_VERSES.isha.wordEnd,
    },
  },
};

export const calcMethodLabels: Record<CalculationMethod, string> = {
  EGYPTIAN: "الهيئة المصرية العامة",
  UMM_AL_QURA: "أم القرى",
  ISNA: "ISNA",
  KARACHI: "كاراتشي",
  MWL: "رابطة العالم الإسلامي",
};

export const asrSchoolLabels: Record<AsrSchool, string> = {
  STANDARD: "الجمهور (الشافعي، المالكي، الحنبلي)",
  HANAFI: "حنفي",
};
