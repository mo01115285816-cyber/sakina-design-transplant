import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { SeamlessBgVideo } from './SeamlessBgVideo';
import { 
  ChevronDown, 
  Star, 
  Moon, 
  Rewind, 
  FastForward, 
  Play, 
  Pause, 
  List, 
  Cast, 
  Volume2, 
  X, 
  Check, 
  VolumeX,
  Clock,
  Sparkles,
  Search,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  Video,
  VideoOff,
  Film
} from 'lucide-react';
import { surahNames } from "@/data/surahNames";
import { vocalizedSurahNames } from "@/data/vocalizedSurahNames";

// Transliterated English Names for Surahs
const SURAH_TRANSLITERATIONS: Record<number, string> = {
  1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Aal-E-Imran", 4: "An-Nisa'", 5: "Al-Ma'idah",
  6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Tawbah", 10: "Yunus",
  11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
  16: "An-Nahl", 17: "Al-Isra'", 18: "Al-Kahf", 19: "Maryam", 20: "Taha",
  21: "Al-Anbiya'", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
  26: "Ash-Shu'ara'", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-Ankabut", 30: "Ar-Rum",
  31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba'", 35: "Fatir",
  36: "Yasin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
  41: "Fussilat", 42: "Ash-Shura", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jathiyah",
  46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
  51: "Adh-Dhariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
  56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadila", 59: "Al-Hashr", 60: "Al-Mumtahanah",
  61: "As-Saff", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun", 65: "At-Talaq",
  66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
  71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah",
  76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba'", 79: "An-Nazi'at", 80: "'Abasa",
  81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Inshiqaq", 85: "Al-Buruj",
  86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghashiyah", 89: "Al-Fajr", 90: "Al-Balad",
  91: "Ash-Shams", 92: "Al-Layl", 93: "Ad-Duhaa", 94: "Ash-Sharh", 95: "At-Tin",
  96: "Al-'Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-'Adiyat",
  101: "Al-Qari'ah", 102: "At-Takathur", 103: "Al-'Asr", 104: "Al-Humazah", 105: "Al-Fil",
  106: "Quraysh", 107: "Al-Ma'un", 108: "Al-Kawthar", 109: "Al-Kafirun", 110: "An-Nasr",
  111: "Al-Masad", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
};

interface Props {
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  reciter: {
    id: number;
    name: string;
    photoUrl?: string;
    photo?: string;
  };
  moshaf?: {
    id: number;
    name: string;
    server: string;
    surah_list: string;
  };
  surahId: number;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  timerMinutesRemaining: number | null;
  onSetTimer: (minutes: number | null) => void;
  repeatMode?: "none" | "one" | "all";
  onSetRepeatMode?: (mode: "none" | "one" | "all") => void;
  onOpenReader?: () => void;
  playlist?: number[];
  onPlaySurah?: (surahId: number, playlist: number[]) => void;
}

export function QuranAudioPlayerScreen({
  audioRef,
  reciter,
  moshaf,
  surahId,
  onClose,
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  playbackRate,
  onPlaybackRateChange,
  timerMinutesRemaining,
  onSetTimer,
  repeatMode = "none",
  onSetRepeatMode,
  onOpenReader,
  playlist = [],
  onPlaySurah,
}: Props) {
  const dragControls = useDragControls();

  // Modal Sheet States
  const [activeSheet, setActiveSheet] = useState<"ambient" | "timer" | "speed" | "queue" | "volume" | "cast" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShuffle, setIsShuffle] = useState(false);

  // Drag scrubbing states for progress bar
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number) => {
    if (!trackRef.current || duration <= 0) return;
    setIsDragging(true);
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setDragProgress(percent);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setDragProgress(percent);
  };

  const handleDragEnd = () => {
    if (isDragging && dragProgress !== null) {
      const targetTime = (dragProgress / 100) * duration;
      onSeek(targetTime);
    }
    setIsDragging(false);
    setDragProgress(null);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX);
    };

    const onMouseUp = () => {
      handleDragEnd();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX);
      }
    };

    const onTouchEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, dragProgress, duration]);

  // Favorite Star state
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('quran_favorite_surahs') || '[]');
      return favs.includes(`${reciter.id}_${surahId}`);
    } catch {
      return false;
    }
  });

  const toggleFavorite = () => {
    const key = `${reciter.id}_${surahId}`;
    try {
      const favs = JSON.parse(localStorage.getItem('quran_favorite_surahs') || '[]');
      let updated: string[];
      if (favs.includes(key)) {
        updated = favs.filter((k: string) => k !== key);
        setIsFavorite(false);
      } else {
        updated = [...favs, key];
        setIsFavorite(true);
      }
      localStorage.setItem('quran_favorite_surahs', JSON.stringify(updated));
    } catch {
      setIsFavorite(!isFavorite);
    }
  };

  // Video Background State
  const BG_VIDEOS = [
    { id: 0, name: 'غابة', src: '/videos/1.mp4' },
    { id: 1, name: 'غروب', src: '/videos/2.mp4' },
    { id: 2, name: 'سحاب', src: '/videos/3.mp4' },
    { id: 3, name: 'أمواج', src: '/videos/4.mp4' },
    { id: 4, name: 'مطر', src: '/videos/5.mp4' },
    { id: 5, name: 'نهر', src: '/videos/6.mp4' },
    { id: 6, name: 'بحر', src: '/videos/7.mp4' },
    { id: 7, name: 'فجر', src: '/videos/8.mp4' },
    { id: 8, name: 'طبيعة', src: '/videos/9.mp4' },
  ];

  const [bgVideoIndex, setBgVideoIndex] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('quran_player_bg_video');
      const parsed = saved !== null ? JSON.parse(saved) : null;
      return typeof parsed === 'number' && parsed >= 0 && parsed < BG_VIDEOS.length ? parsed : null;
    } catch {
      return null;
    }
  });

  const selectBgVideo = (index: number | null) => {
    setBgVideoIndex(index);
    try {
      if (index === null) localStorage.removeItem('quran_player_bg_video');
      else localStorage.setItem('quran_player_bg_video', JSON.stringify(index));
    } catch {}
  };

  const isVideoTheme = bgVideoIndex !== null && bgVideoIndex >= 0 && bgVideoIndex < BG_VIDEOS.length;
  const currentBgVideoSrc = isVideoTheme ? BG_VIDEOS[bgVideoIndex!].src : null;

  // Time Formatting Helpers
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRemainingTime = () => {
    if (isNaN(duration) || duration <= 0) return "-00:51";
    const rem = Math.max(0, duration - currentTime);
    const mins = Math.floor(rem / 60);
    const secs = Math.floor(rem % 60);
    return `-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Seek Progress calculation
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const currentProgressPercent = isDragging && dragProgress !== null ? dragProgress : progressPercent;

  // Reciter Photo Resolution
  const reciterPhoto = reciter.photoUrl || reciter.photo || "/images/quran_artwork.jpg";
  const arabicName = surahNames[surahId] || `سورة ${surahId}`;
  const vocalizedName = vocalizedSurahNames[surahId] || `سُورَةُ ${arabicName}`;

  // Surah list for Queue card
  const availableSurahs = useMemo(() => {
    if (!moshaf?.surah_list) return [];
    return moshaf.surah_list.split(',').map(Number).filter(id => id > 0 && id <= 114);
  }, [moshaf]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return availableSurahs;
    const q = searchQuery.trim().toLowerCase();
    return availableSurahs.filter(sId => {
      const eng = (SURAH_TRANSLITERATIONS[sId] || '').toLowerCase();
      const arb = (surahNames[sId] || '').toLowerCase();
      const voc = (vocalizedSurahNames[sId] || '').toLowerCase();
      return eng.includes(q) || arb.includes(q) || voc.includes(q) || sId.toString().includes(q);
    });
  }, [availableSurahs, searchQuery]);

  return (
    <motion.div 
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.85 }}
      dragSnapToOrigin={true}
      onDragEnd={(_event, info) => {
        if (info.offset.y > 100 || info.velocity.y > 350) {
          onClose();
        }
      }}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none font-sans min-h-screen transition-colors duration-500 ${
        isVideoTheme ? 'text-white' : 'text-[#2b1a10]'
      }`}
      dir="ltr"
    >
      {/* Layered background transitions (Z-axis bottom-most) */}
      <div 
        className={`absolute inset-0 -z-20 transition-colors duration-500 ${
          isVideoTheme ? 'bg-black' : 'bg-[#ece7de]'
        }`} 
      />

      {currentBgVideoSrc && (
        <SeamlessBgVideo key={bgVideoIndex} src={currentBgVideoSrc} />
      )}

      {/* Dynamic Contrast Scrims (Optical Shielding Overlay in video mode) */}
      {isVideoTheme && (
        <>
          {/* Top-down scrim (protects Header and Dropdown) - Soft and elegant */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent pointer-events-none z-0" />
          {/* Bottom-up scrim (protects Metadata, seek, controls, and footer) - Lowered to 42% height and soft opacity */}
          <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/40 via-black/12 to-transparent pointer-events-none z-0" />
        </>
      )}

      {/* Top Ambient Light Glow Overlay (Static mode only) */}
      {!isVideoTheme && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#b88a4f]/12 via-transparent to-[#deab65]/15 pointer-events-none z-0" />
          <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: 'radial-gradient(circle at 50% 100%, rgba(222, 171, 101, 0.28) 0%, rgba(236, 231, 222, 0) 75%)'
            }}
          />
        </>
      )}

      {/* ─────────────────── TOP BAR ─────────────────── */}
      <header className="relative z-50 pt-2 px-6 flex flex-col items-center shrink-0">
        {/* Swipe Handle Indicator Bar (Interactive drag to dismiss handle) */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          onClick={onClose}
          aria-label="Drag to dismiss or click to close player"
          className="py-2 px-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none mb-1 group"
        >
          <div
            className={`w-12 h-1.5 rounded-full transition-all duration-200 group-hover:scale-x-110 group-active:scale-95 ${
              isVideoTheme
                ? 'bg-white/40 group-hover:bg-white/60 shadow-[0_1px_4px_rgba(0,0,0,0.25)] backdrop-blur-sm'
                : 'bg-[#2b1a10]/25 group-hover:bg-[#2b1a10]/40 shadow-[0_1px_2px_rgba(43,26,16,0.12)]'
            }`}
          />
        </div>

        {/* Top Dropdown Pill ("الخلفيات") - Text only, toggles menu */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'ambient' ? null : 'ambient')}
          className={`hover:opacity-90 active:scale-95 transition-all rounded-full px-6 py-2 font-sans font-bold text-sm flex items-center justify-center cursor-pointer ${
            isVideoTheme
              ? 'liquid-glass-capsule text-white optical-shadow-guard'
              : 'cut-crystal-capsule border-[#2b1a10]/10 text-[#2b1a10]'
          }`}
          dir="rtl"
        >
          <span className="text-[14px] font-sans font-bold tracking-wide">
            الخلفيات
          </span>
        </button>
      </header>


      {/* ─────────────────── FLOATING BACKGROUND VIDEO CARD (الخلفيات) ─────────────────── */}
      <AnimatePresence>
        {activeSheet === 'ambient' && (
          <>
            {/* Transparent click-outside overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 z-30 pointer-events-auto"
            />
            {/* Centered card container */}
            <div className="absolute inset-x-0 top-[56px] z-40 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ type: "spring", stiffness: 600, damping: 38 }}
                className={`w-[calc(100%-32px)] max-w-[340px] rounded-[28px] p-4 flex flex-col pointer-events-auto will-change-transform font-sans ${
                  isVideoTheme
                    ? 'liquid-glass-card text-white'
                    : 'cut-crystal-panel text-[#2b1a10]'
                }`}
                dir="rtl"
              >
                {/* Header (Clean title only, no AI icon, no close button) */}
                <div className="flex items-center justify-center pb-2.5 border-b border-current/10 mb-3 shrink-0">
                  <h3 className={`text-base font-display font-bold ${isVideoTheme ? 'text-white' : 'text-[#2b1a10]'}`}>
                    خلفيات الشاشة
                  </h3>
                </div>

                {/* Video Options Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-0.5">
                  {BG_VIDEOS.map((video) => {
                    const isSelected = bgVideoIndex === video.id;
                    const isLastOdd = BG_VIDEOS.length % 2 !== 0 && video.id === BG_VIDEOS.length - 1;
                    return (
                      <button
                        key={video.id}
                        onClick={() => {
                          if (isSelected) {
                            selectBgVideo(null);
                          } else {
                            selectBgVideo(video.id);
                          }
                          setActiveSheet(null);
                        }}
                        className={`py-2.5 px-3.5 rounded-2xl flex items-center justify-between font-bold text-sm transition-all cursor-pointer active:scale-95 ${
                          isLastOdd ? 'col-span-2' : ''
                        } ${
                          isSelected
                            ? isVideoTheme
                              ? 'liquid-glass-button-active text-white border border-white/40 shadow-xs scale-[1.01]'
                              : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white border border-[#c49a62]/40 shadow-xs scale-[1.01]'
                            : isVideoTheme
                              ? 'liquid-glass-button text-white/90 hover:text-white hover:bg-white/20'
                              : 'bg-[#2b1a10]/05 border border-[#2b1a10]/08 text-[#2b1a10] hover:bg-[#b88a4f]/10 hover:border-[#b88a4f]/30 hover:text-[#b88a4f]'
                        }`}
                      >
                        <span className="truncate">{video.name}</span>
                        {isSelected && (
                          <div
                            className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                              isVideoTheme
                                ? 'bg-white text-black'
                                : 'bg-white text-[#b88a4f]'
                            }`}
                          >
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>


      {/* ─────────────────── FLOATING QUEUE CARD (متابعة التشغيل) ─────────────────── */}
      <AnimatePresence>
        {activeSheet === 'queue' && (
          <>
            {/* Transparent click-outside overlay without dark blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 z-30 pointer-events-auto"
            />
            {/* Perfectly centered flex layout container to prevent translation clashing */}
            <div className="absolute inset-x-0 top-[56px] bottom-[270px] z-40 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ type: "spring", stiffness: 600, damping: 38 }}
                className={`w-[calc(100%-32px)] max-w-[360px] h-full max-h-[410px] rounded-[32px] p-4.5 flex flex-col pointer-events-auto will-change-transform font-sans ${
                  isVideoTheme
                    ? 'liquid-glass-card text-white'
                    : 'cut-crystal-panel text-[#2b1a10]'
                }`}
                dir="rtl"
              >
                {/* Header Row: Title on right, Action Buttons on left */}
                <div className="flex items-center justify-between mb-2.5 px-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (onSetRepeatMode) {
                          const nextMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
                          onSetRepeatMode(nextMode);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                        repeatMode !== 'none' 
                          ? isVideoTheme
                            ? 'bg-white text-black font-bold shadow-sm'
                            : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white font-bold shadow-sm' 
                          : isVideoTheme ? 'liquid-glass-button text-white/80' : 'bg-[#2b1a10]/05 text-[#7f6a55] hover:text-[#2b1a10] hover:bg-[#b88a4f]/10 border border-[#2b1a10]/05'
                      }`}
                      aria-label="Repeat mode"
                    >
                      {repeatMode === 'one' ? <Repeat1 size={15} /> : <Repeat size={15} />}
                    </button>

                    <button
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                        isShuffle 
                          ? isVideoTheme
                            ? 'bg-white text-black font-bold shadow-sm'
                            : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white font-bold shadow-sm' 
                          : isVideoTheme ? 'liquid-glass-button text-white/80' : 'bg-[#2b1a10]/05 text-[#7f6a55] hover:text-[#2b1a10] hover:bg-[#b88a4f]/10 border border-[#2b1a10]/05'
                      }`}
                      aria-label="Shuffle"
                    >
                      <Shuffle size={15} />
                    </button>
                  </div>

                  <h3 className={`text-base font-display font-bold tracking-wide ${isVideoTheme ? 'text-white' : 'text-[#2b1a10]'}`}>
                    متابعة التشغيل
                  </h3>
                </div>

                {/* Fully Rounded Search Bar */}
                <div className="relative w-full mb-2.5 shrink-0">
                  <input
                    type="text"
                    placeholder="بحث"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-2 pr-9 pl-4 text-sm rounded-full focus:outline-none transition-colors text-right font-sans ${
                      isVideoTheme
                        ? 'liquid-glass-input text-white placeholder-white/60'
                        : 'cut-crystal-input text-[#2b1a10] placeholder-[#7f6a55]/60'
                    }`}
                  />
                  <Search size={15} className={`absolute right-3.5 top-2.5 pointer-events-none ${isVideoTheme ? 'text-white/60' : 'text-[#b88a4f]'}`} />
                </div>

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                  {filteredSurahs.map((sId) => {
                    const isCurrent = sId === surahId;
                    const sArabic = surahNames[sId] || `سورة ${sId}`;
                    const sVocalized = vocalizedSurahNames[sId] || `سُورَةُ ${sArabic}`;

                    if (isCurrent) {
                      return (
                        <div
                          key={sId}
                          className={`w-full p-2.5 rounded-2xl flex items-center justify-between shadow-sm transition-all font-sans ${
                            isVideoTheme
                              ? 'bg-white/15 border border-white/25 text-white shadow-[inset_0_1px_rgba(255,255,255,0.20)]'
                              : 'bg-[#f5ebd6] border border-[#c49a62] text-[#2b1a10] shadow-[0_4px_12px_rgba(43,26,16,0.06)]'
                          }`}
                        >
                          <button
                            onClick={onTogglePlay}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#deab65] to-[#b88a4f] text-white flex items-center justify-center active:scale-95 transition-transform shrink-0 shadow-xs cursor-pointer"
                          >
                            {isPlaying ? <Pause size={15} className="fill-white" /> : <Play size={15} className="fill-white translate-x-[0.5px]" />}
                          </button>

                          <div className="flex-1 text-right px-3 min-w-0">
                            <p className={`text-sm font-bold leading-snug truncate ${isVideoTheme ? 'text-white' : 'text-[#2b1a10]'}`}>{sVocalized}</p>
                            <p className={`text-xs font-bold truncate ${isVideoTheme ? 'text-white/70' : 'text-[#7f6a55]'}`}>{sArabic}</p>
                          </div>

                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isVideoTheme ? 'bg-white/10 border-white/10' : 'bg-[#ece7de] border-[#2b1a10]/08'
                          }`}>
                            <div className={`flex items-center gap-0.5 ${isVideoTheme ? 'text-white' : 'text-[#b88a4f]'}`}>
                              <div className={`w-0.5 h-3 rounded-full animate-bounce ${isVideoTheme ? 'bg-white' : 'bg-[#b88a4f]'}`} style={{ animationDelay: '0ms' }} />
                              <div className={`w-0.5 h-4 rounded-full animate-bounce ${isVideoTheme ? 'bg-white' : 'bg-[#b88a4f]'}`} style={{ animationDelay: '150ms' }} />
                              <div className={`w-0.5 h-2.5 rounded-full animate-bounce ${isVideoTheme ? 'bg-white' : 'bg-[#b88a4f]'}`} style={{ animationDelay: '300ms' }} />
                              <div className={`w-0.5 h-3.5 rounded-full animate-bounce ${isVideoTheme ? 'bg-white' : 'bg-[#b88a4f]'}`} style={{ animationDelay: '450ms' }} />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={sId}
                        onClick={() => {
                          if (onPlaySurah) {
                            onPlaySurah(sId, availableSurahs);
                          }
                        }}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer group font-sans ${
                          isVideoTheme
                            ? 'hover:bg-white/15 text-white'
                            : 'hover:bg-[#b88a4f]/08 text-[#2b1a10] hover:text-[#b88a4f]'
                        }`}
                      >
                        <div className="w-8 h-8 shrink-0" />
                        <div className="flex-1 text-right px-3 min-w-0">
                          <p className="text-sm font-bold leading-snug truncate">{sVocalized}</p>
                          <p className={`text-xs font-medium truncate ${isVideoTheme ? 'text-white/70' : 'text-[#7f6a55] group-hover:text-[#b88a4f]/80'}`}>{sArabic}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 border transition-all ${
                          isVideoTheme
                            ? 'bg-white/10 border-white/10 text-white/90'
                            : 'bg-[#f5ebd6] border-[#2b1a10]/08 text-[#b88a4f] group-hover:bg-[#b88a4f] group-hover:text-white group-hover:border-transparent group-hover:shadow-xs'
                        }`}>
                          {sId}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>


      {/* ─────────────────── MAIN METADATA BLOCK ─────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col justify-end px-6 pb-2">
        <div className="flex items-center justify-between w-full mb-8">
          
          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer active:scale-95 ${
              isVideoTheme ? 'liquid-glass-button text-white' : 'cut-crystal-capsule shadow-sm backdrop-blur-md'
            }`}
            aria-label="Favorite surah"
          >
            <Star 
              size={16} 
              className={isFavorite ? (isVideoTheme ? "fill-white text-white optical-shadow-guard" : "fill-[#deab65] text-[#b88a4f] drop-shadow-xs") : isVideoTheme ? "text-white/70" : "text-[#7f6a55]"} 
            />
          </button>

          {/* Title & Sheikh Info */}
          <div className="flex items-center gap-4 text-right">
            <div className="flex flex-col items-end">
              <h2 className={`text-2xl sm:text-3xl font-display font-bold tracking-tight leading-tight ${isVideoTheme ? 'text-white optical-shadow-guard' : 'text-[#2b1a10]'}`}>
                {vocalizedName}
              </h2>
              <p className={`text-[15px] sm:text-[16px] font-bold font-sans mt-0.5 ${isVideoTheme ? 'text-white/75 optical-shadow-guard' : 'text-[#7f6a55]'}`} dir="rtl">
                {reciter.name}
              </p>
            </div>

            {/* Sheikh Avatar */}
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-[#c49a62] shadow-[0_8px_24px_rgba(0,0,0,0.3)] shrink-0 bg-[#f5ebd6]">
              <img 
                src={reciterPhoto} 
                alt={reciter.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/quran_artwork.jpg";
                }}
              />
            </div>
          </div>

        </div>

        {/* ─────────────────── PLAYBACK CONTROLS ROW ─────────────────── */}
        <div className="flex items-center justify-between w-full px-2 mb-8">
          
          {/* 1. Sleep Timer */}
          <button
            onClick={() => setActiveSheet(activeSheet === 'timer' ? null : 'timer')}
            className={`transition-all active:scale-90 cursor-pointer flex items-center justify-center relative ${
              isVideoTheme 
                ? 'p-2 text-white/95 hover:text-white optical-shadow-guard' 
                : 'p-2 text-[#7f6a55] hover:text-[#2b1a10]'
            }`}
            aria-label="Sleep timer"
          >
            <div className="relative">
              <Moon size={22} strokeWidth={2.2} />
              {timerMinutesRemaining !== null && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse ${isVideoTheme ? 'bg-white' : 'bg-[#deab65]'}`} />
              )}
            </div>
          </button>

          {/* 2. Skip Back (◀◀) */}
          <button
            onClick={() => {
              if (currentTime > 5) {
                onSeek(Math.max(0, currentTime - 10));
              } else {
                onPrev();
              }
            }}
            className={`transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
              isVideoTheme 
                ? 'w-10 h-10 rounded-full liquid-glass-button text-white hover:text-white' 
                : 'p-2 text-[#2b1a10] hover:text-[#b88a4f]'
            }`}
            aria-label="Previous or Rewind"
          >
            <Rewind size={isVideoTheme ? 18 : 28} className="fill-current" />
          </button>

          {/* 3. Main Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isVideoTheme
                ? 'w-14 h-14 rounded-full liquid-glass-play-btn text-white hover:scale-105'
                : 'w-14 h-14 rounded-full bg-gradient-to-br from-[#deab65] to-[#b88a4f] text-white shadow-[0_10px_28px_rgba(184,138,79,0.4)] border border-[#c49a62]'
            }`}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={isVideoTheme ? 24 : 38} className={isVideoTheme ? "fill-current text-current" : "fill-white text-white"} />
            ) : (
              <Play size={isVideoTheme ? 24 : 38} className={isVideoTheme ? "fill-current text-current translate-x-[1px]" : "fill-white text-white translate-x-[2px]"} />
            )}
          </button>

          {/* 4. Skip Forward (▶▶) */}
          <button
            onClick={() => {
              if (duration && (duration - currentTime) > 10) {
                onSeek(Math.min(duration, currentTime + 10));
              } else {
                onNext();
              }
            }}
            className={`transition-all active:scale-90 cursor-pointer flex items-center justify-center ${
              isVideoTheme 
                ? 'w-10 h-10 rounded-full liquid-glass-button text-white hover:text-white' 
                : 'p-2 text-[#2b1a10] hover:text-[#b88a4f]'
            }`}
            aria-label="Next or Fast forward"
          >
            <FastForward size={isVideoTheme ? 18 : 28} className="fill-current" />
          </button>

          {/* 5. Playback Speed Selector */}
          <button
            onClick={() => setActiveSheet(activeSheet === 'speed' ? null : 'speed')}
            className={`transition-all active:scale-90 cursor-pointer flex items-center justify-center font-bold ${
              isVideoTheme 
                ? 'p-2 text-white/90 hover:text-white text-base optical-shadow-guard' 
                : 'p-2 text-[#b88a4f] hover:text-[#2b1a10] text-base'
            }`}
            aria-label="Playback speed"
          >
            ×{playbackRate}
          </button>

        </div>

        {/* ─────────────────── SEEK BAR & TIMERS ─────────────────── */}
        <div className="w-full flex flex-col mb-6">
          <div 
            ref={trackRef}
            className={`relative w-full rounded-full cursor-pointer transition-[height] duration-150 select-none flex items-center group overflow-hidden ${
              isDragging ? 'h-3' : 'h-1.5 hover:h-3'
            } ${
              isVideoTheme
                ? 'liquid-glass-input'
                : 'bg-[#2b1a10]/12'
            }`}
            onMouseDown={(e) => {
              handleDragStart(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.touches.length > 0) {
                handleDragStart(e.touches[0].clientX);
              }
            }}
          >
            <div 
              className={`absolute top-0 bottom-0 left-0 rounded-full h-full ${isVideoTheme ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f]'}`}
              style={{ width: `${currentProgressPercent}%` }}
            />
          </div>

          <div className={`flex items-center justify-between w-full mt-2 text-sm font-bold font-mono tracking-tight ${
            isVideoTheme ? 'text-white/85 optical-shadow-guard' : 'text-[#7f6a55]'
          }`}>
            <span>{formatRemainingTime()}</span>
            <span>{formatTime(isDragging && dragProgress !== null ? (dragProgress / 100) * duration : currentTime)}</span>
          </div>
        </div>
      </main>


      {/* ─────────────────── BOTTOM ACTION BAR ─────────────────── */}
      <footer className="relative z-10 px-8 pb-8 pt-2 flex items-center justify-between bg-transparent shrink-0">
        
        {/* Queue */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'queue' ? null : 'queue')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoTheme
              ? activeSheet === 'queue'
                ? 'liquid-glass-button-active text-white'
                : 'liquid-glass-button text-white/80 hover:text-white active:scale-95'
              : activeSheet === 'queue'
                ? 'bg-[#b88a4f]/15 text-[#b88a4f]'
                : 'text-[#7f6a55] hover:text-[#2b1a10] active:scale-95'
          }`}
          aria-label="Surahs list"
        >
          <List size={isVideoTheme ? 18 : 24} strokeWidth={2.2} />
        </button>

        {/* Cast */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'cast' ? null : 'cast')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoTheme
              ? activeSheet === 'cast'
                ? 'liquid-glass-button-active text-white'
                : 'liquid-glass-button text-white/80 hover:text-white active:scale-95'
              : activeSheet === 'cast'
                ? 'bg-[#b88a4f]/15 text-[#b88a4f]'
                : 'text-[#7f6a55] hover:text-[#2b1a10] active:scale-95'
          }`}
          aria-label="Cast audio"
        >
          <Cast size={isVideoTheme ? 16 : 22} strokeWidth={2.2} />
        </button>

        {/* Quran Text View */}
        <button
          onClick={() => {
            if (onOpenReader) onOpenReader();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoTheme
              ? 'liquid-glass-button text-white active:scale-95'
              : 'text-[#2b1a10] hover:text-[#b88a4f] active:scale-95'
          }`}
          aria-label="Open Quran text reader"
        >
          <span className={`${isVideoTheme ? 'text-base' : 'text-2xl'} font-black font-serif leading-none select-none drop-shadow-xs`}>
            ق
          </span>
        </button>

        {/* Volume & Sound Effects */}
        <button
          onClick={() => setActiveSheet(activeSheet === 'volume' ? null : 'volume')}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isVideoTheme
              ? activeSheet === 'volume'
                ? 'liquid-glass-button-active text-white'
                : 'liquid-glass-button text-white/80 hover:text-white active:scale-95'
              : activeSheet === 'volume'
                ? 'bg-[#b88a4f]/15 text-[#b88a4f]'
                : 'text-[#7f6a55] hover:text-[#2b1a10] active:scale-95'
          }`}
          aria-label="Volume settings"
        >
          <Volume2 size={isVideoTheme ? 18 : 24} strokeWidth={2.2} />
        </button>

      </footer>


      {/* ─────────────────── MODALS / POPOVERS ─────────────────── */}

      {/* Sheet 2: Sleep Timer ("مؤقت النوم") */}
      <AnimatePresence>
        {activeSheet === 'timer' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed bottom-0 inset-x-0 z-50 p-6 pb-10 flex flex-col text-white rounded-t-[32px] font-sans ${
                isVideoTheme 
                  ? 'liquid-glass-sheet' 
                  : 'bg-[#1a1512]/98 border-white/15 backdrop-blur-2xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.3)]'
              }`}
              dir="rtl"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Moon size={18} className={isVideoTheme ? "text-white" : "text-[#deab65]"} />
                  <h3 className="text-lg font-display font-bold text-white">مؤقت النوم الإيقاف التلقائي</h3>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "إيقاف المؤقت", minutes: null },
                  { label: "٥ دقائق", minutes: 5 },
                  { label: "١٠ دقائق", minutes: 10 },
                  { label: "١٥ دقيقة", minutes: 15 },
                  { label: "٣٠ دقيقة", minutes: 30 },
                  { label: "٤٥ دقيقة", minutes: 45 },
                  { label: "ساعة كاملة", minutes: 60 },
                ].map((item, idx) => {
                  const isSelected = item.minutes === null 
                    ? timerMinutesRemaining === null 
                    : timerMinutesRemaining !== null && Math.abs(timerMinutesRemaining - item.minutes) < 1;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onSetTimer(item.minutes);
                        setActiveSheet(null);
                      }}
                      className={`p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between cursor-pointer font-sans ${
                        isSelected 
                          ? isVideoTheme
                            ? 'bg-white text-black shadow-md scale-[1.02]'
                            : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white shadow-md scale-[1.02]' 
                          : isVideoTheme
                            ? 'liquid-glass-button text-white hover:bg-white/20'
                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check size={18} className={isVideoTheme ? "text-black" : "text-white"} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Sheet 3: Playback Speed ("سرعة التشغيل") */}
      <AnimatePresence>
        {activeSheet === 'speed' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed bottom-0 inset-x-0 z-50 p-6 pb-10 flex flex-col text-white rounded-t-[32px] font-sans ${
                isVideoTheme 
                  ? 'liquid-glass-sheet' 
                  : 'bg-[#1a1512]/98 border-white/15 backdrop-blur-2xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.3)]'
              }`}
              dir="rtl"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={18} className={isVideoTheme ? "text-white" : "text-[#deab65]"} />
                  <h3 className="text-lg font-display font-bold text-white">سرعة التشغيل</h3>
                </div>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 font-sans">
                {[
                  { rate: 0.5, label: "0.5x - بطيء جداً" },
                  { rate: 0.75, label: "0.75x - بطيء" },
                  { rate: 1.0, label: "1.0x - عادي (افتراضي)" },
                  { rate: 1.25, label: "1.25x - سريع" },
                  { rate: 1.5, label: "1.5x - سريع جداً" },
                  { rate: 2.0, label: "2.0x - ضعف السرعة" },
                ].map((item) => {
                  const isSelected = playbackRate === item.rate;
                  return (
                    <button
                      key={item.rate}
                      onClick={() => {
                        onPlaybackRateChange(item.rate);
                        setActiveSheet(null);
                      }}
                      className={`w-full p-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between cursor-pointer font-sans ${
                        isSelected 
                          ? isVideoTheme
                            ? 'bg-white text-black shadow-md'
                            : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white shadow-md' 
                          : isVideoTheme
                            ? 'liquid-glass-button text-white hover:bg-white/20'
                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check size={18} className={isVideoTheme ? "text-black" : "text-white"} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Floating Volume Control Pill */}
      <AnimatePresence>
        {activeSheet === 'volume' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 z-40 pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ type: "spring", stiffness: 850, damping: 42 }}
              className={`absolute bottom-[78px] right-4 sm:right-8 z-50 w-52 sm:w-56 rounded-full px-3.5 py-2 flex items-center gap-3 select-none will-change-transform font-sans ${
                isVideoTheme
                  ? 'liquid-glass-capsule text-white shadow-[0_12px_36px_rgba(0,0,0,0.35)]'
                  : 'bg-[#fdfcfb]/98 border-[#2b1a10]/12 text-[#2b1a10] shadow-[0_12px_36px_rgba(43,26,16,0.14)] backdrop-blur-2xl border'
              }`}
              dir="ltr"
            >
              <button 
                onClick={() => onVolumeChange(0)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-90 ${
                  isVideoTheme 
                    ? 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white' 
                    : 'bg-[#2b1a10]/04 hover:bg-[#b88a4f]/10 text-[#7f6a55] hover:text-[#b88a4f] border border-[#2b1a10]/03'
                }`}
                aria-label="Mute volume"
              >
                <VolumeX size={15} />
              </button>

              <div className="relative flex-1 flex items-center h-4 group">
                <div className={`absolute inset-x-0 h-1.5 rounded-full pointer-events-none ${
                  isVideoTheme ? 'bg-white/20' : 'bg-[#2b1a10]/08'
                }`} />
                <div 
                  className={`absolute left-0 h-1.5 rounded-full pointer-events-none ${isVideoTheme ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f]'}`}
                  style={{ width: `${volume * 100}%` }}
                />
                <div 
                  className={`absolute w-3.5 h-3.5 rounded-full shadow-md transition-transform pointer-events-none ${
                    isVideoTheme 
                      ? 'bg-white shadow-[0_1.5px_4px_rgba(0,0,0,0.35)]' 
                      : 'bg-[#b88a4f] border-2 border-[#fdfcfb] shadow-[0_2px_6px_rgba(184,138,79,0.35)]'
                  } group-hover:scale-115`}
                  style={{ left: `calc(${volume * 100}% - 7px)` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
              </div>

              <button 
                onClick={() => onVolumeChange(1)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-90 ${
                  isVideoTheme 
                    ? 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white' 
                    : 'bg-[#2b1a10]/04 hover:bg-[#b88a4f]/10 text-[#7f6a55] hover:text-[#b88a4f] border border-[#2b1a10]/03'
                }`}
                aria-label="Max volume"
              >
                <Volume2 size={15} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Sheet 6: Cast / Wireless Broadcast Modal */}
      <AnimatePresence>
        {activeSheet === 'cast' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSheet(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed bottom-0 inset-x-0 z-50 p-6 pb-10 flex flex-col text-center text-white rounded-t-[32px] font-sans ${
                isVideoTheme 
                  ? 'liquid-glass-sheet' 
                  : 'bg-[#1a1512]/98 border-white/15 backdrop-blur-2xl border-t shadow-[0_-10px_40px_rgba(0,0,0,0.3)]'
              }`}
              dir="rtl"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isVideoTheme ? 'bg-white/10 text-white border-white/20' : 'bg-white/10 text-[#deab65] border-white/20'}`}>
                <Cast size={32} />
              </div>

              <h3 className="text-xl font-display font-bold text-white mb-2">البث اللاسلكي والأجهزة المجاورة</h3>
              <p className="text-sm text-white/70 mb-6 max-w-xs mx-auto font-medium font-sans">
                يمكنك توصيل تطبيق السكينة بأجهزة Chromecast أو Bluetooth أو AirPlay للاستماع بجودة عالية.
              </p>

              <button
                onClick={() => setActiveSheet(null)}
                className={`w-full py-3.5 rounded-2xl font-bold text-base shadow-md active:scale-95 transition-all cursor-pointer font-sans ${isVideoTheme ? 'bg-white text-black hover:bg-white/90' : 'bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white'}`}
              >
                حسناً، فهمت
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default QuranAudioPlayerScreen;
