import React, { useState, useEffect, useCallback } from "react";
import { azkarData, type AzkarItem } from "@/data/azkarData";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Bookmark,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Info,
  Share2,
} from "lucide-react";
import { hisnAlMuslimData, type HisnCategory } from "@/data/hisnAlMuslimData";

type Props = {
  azkarType: "morning" | "evening" | "sleep" | "post_prayer" | "hisn";
  hisnCategory?: string;
  onClose: () => void;
};

const titleMap: Record<string, string> = {
  morning: "أذكار الصباح",
  evening: "أذكار المساء",
  sleep: "أذكار النوم",
  post_prayer: "أذكار بعد الصلاة",
};

// Animation variants for Apple-style fluid vertical sliding cards
const cardVariants = {
  enter: (direction: "up" | "down") => ({
    y: direction === "up" ? 360 : -360,
    opacity: 0,
    scale: 0.94,
    filter: "blur(2px)",
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 24,
      mass: 0.8,
    },
  },
  exit: (direction: "up" | "down") => ({
    y: direction === "up" ? -360 : 360,
    opacity: 0,
    scale: 0.94,
    filter: "blur(2px)",
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 24,
      mass: 0.8,
    },
  }),
};

export default function AzkarCounterScreen({
  azkarType,
  hisnCategory,
  onClose,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [showSource, setShowSource] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const transitionTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Resolve the azkar list
  const items: AzkarItem[] = (() => {
    switch (azkarType) {
      case "morning":
        return azkarData.morningAzkar;
      case "evening":
        return azkarData.eveningAzkar;
      case "sleep":
        return azkarData.sleepAzkar;
      case "post_prayer":
        return azkarData.postPrayerAzkar;
      case "hisn":
        return hisnAlMuslimData.getAzkarByCategory(
          hisnCategory as HisnCategory,
        );
      default:
        return [];
    }
  })();

  const title = azkarType === "hisn" ? hisnCategory : titleMap[azkarType];

  const total = items.length;
  const item = items[currentIndex];
  const isLast = currentIndex >= total - 1;
  const isComplete = currentCount >= (item?.count ?? 0);

  // Load and save Bookmarks from LocalStorage
  const getBookmarkKey = useCallback(() => {
    if (!item) return "";
    if (azkarType === "hisn") {
      return `hisn_${hisnCategory}_${item.id}`;
    }
    return `${azkarType}_${item.id}`;
  }, [item, azkarType, hisnCategory]);

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("bookmarked_azkar_keys");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isBookmarked = item ? bookmarks.includes(getBookmarkKey()) : false;

  const toggleBookmark = () => {
    const key = getBookmarkKey();
    if (!key) return;
    let updated: string[];
    if (isBookmarked) {
      updated = bookmarks.filter((k) => k !== key);
      triggerToast("تمت الإزالة من المفضلة");
    } else {
      updated = [...bookmarks, key];
      triggerToast("تم الحفظ في المفضلة");
    }
    setBookmarks(updated);
    localStorage.setItem("bookmarked_azkar_keys", JSON.stringify(updated));
  };

  // Load and save Font Size
  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("azkar_font_size");
      return saved ? parseInt(saved, 10) : 22; // Default 22px
    } catch {
      return 22;
    }
  });

  const changeFontSize = () => {
    const sizes = [18, 22, 26, 30];
    const nextIndex = (sizes.indexOf(fontSize) + 1) % sizes.length;
    const nextSize = sizes[nextIndex];
    setFontSize(nextSize);
    localStorage.setItem("azkar_font_size", nextSize.toString());

    const labels: Record<number, string> = {
      18: "حجم الخط: صغير",
      22: "حجم الخط: متوسط",
      26: "حجم الخط: كبير",
      30: "حجم الخط: كبير جداً",
    };
    triggerToast(labels[nextSize]);
  };

  // Load and save Auto-Transition mode
  const [autoTransition, setAutoTransition] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("azkar_auto_transition");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const toggleAutoTransition = () => {
    const nextVal = !autoTransition;
    setAutoTransition(nextVal);
    localStorage.setItem("azkar_auto_transition", nextVal ? "true" : "false");
    triggerToast(
      nextVal ? "تم تفعيل الانتقال التلقائي" : "تم إيقاف الانتقال التلقائي",
    );

    // If transitioning ON and current zikr is already completed, schedule immediate jump
    if (nextVal && isComplete && !isLast) {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = setTimeout(() => {
        setDirection("up");
        setCurrentIndex((prev) => prev + 1);
      }, 500);
    }
  };

  // Helper to trigger a beautiful temporary toast message
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Autoclose toast after delay
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 1500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Reset count when index changes
  useEffect(() => {
    setCurrentCount(0);
    setShowSource(false);
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, [currentIndex]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Tactile click haptic & sound feedback generators
  const playClickFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.04,
      );
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);

      setTimeout(() => {
        if (audioCtx.state !== "closed") audioCtx.close();
      }, 100);
    } catch {}
  };

  const playCompleteFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([35, 45, 35]);
    }
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.02, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.08,
      );
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.08);

      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.frequency.setValueAtTime(1109, audioCtx.currentTime);
          gain2.gain.setValueAtTime(0.025, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(
            0.001,
            audioCtx.currentTime + 0.12,
          );
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.start();
          osc2.stop(audioCtx.currentTime + 0.12);
        } catch {}
      }, 75);

      setTimeout(() => {
        if (audioCtx.state !== "closed") audioCtx.close();
      }, 300);
    } catch {}
  };

  const handleTap = useCallback(() => {
    if (isComplete || !item) return;
    const nextCount = currentCount + 1;
    setCurrentCount(nextCount);
    if (nextCount >= item.count) {
      playCompleteFeedback();
      if (autoTransition && !isLast) {
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
        }
        transitionTimerRef.current = setTimeout(() => {
          setDirection("up");
          setCurrentIndex((prev) => prev + 1);
        }, 700);
      }
    } else {
      playClickFeedback();
    }
  }, [isComplete, currentCount, item, autoTransition, isLast]);

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setDirection("up");
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection("down");
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item) return;
    try {
      navigator.clipboard.writeText(item.text);
      triggerToast("تم نسخ الذكر بنجاح!");
    } catch {
      triggerToast("فشل نسخ الذكر");
    }
  };

  if (total === 0 || !item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      dir="rtl"
      className="fixed inset-0 z-50 flex flex-col bg-[#ece7de] md:max-w-[430px] md:mx-auto md:shadow-[0_24px_64px_rgba(43,26,16,0.3)] md:my-6 md:rounded-[40px] md:border md:border-white/20 overflow-hidden"
    >
      {/* ── HEADER NAVIGATION ROW ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 pt-6 pb-2">
        {/* Bookmark Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark();
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-all duration-300 ${
            isBookmarked
              ? "bg-[#b88a4f] border-[#b88a4f] text-white shadow-[#b88a4f]/20 scale-105"
              : "cut-crystal-capsule text-[#7f6a55] hover:text-[#2b1a10]"
          }`}
          title="حفظ في المفضلة"
        >
          <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
        </button>

        {/* Close/Back Button */}
        <button
          onClick={onClose}
          className="h-11 w-11 flex items-center justify-center cut-crystal-capsule text-[#7f6a55] hover:text-[#2b1a10] active:scale-95 transition-all"
          title="رجوع"
        >
          <ChevronLeft size={22} className="scale-x-[-1]" />
        </button>
      </header>

      {/* ── TITLE CONTAINER ── */}
      <div className="px-6 pb-2 text-right">
        <h1 className="text-[26px] font-bold text-[#2b1a10] tracking-tight leading-snug font-sans">
          {title}
        </h1>
      </div>

      {/* ── CARD DECK STACK AND VERTICAL NAV ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Up Arrow (Previous) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={currentIndex === 0}
          className={`mb-1.5 flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300 ${
            currentIndex === 0
              ? "opacity-15 cursor-not-allowed text-[#7f6a55]/40"
              : "text-[#7f6a55] hover:text-[#2b1a10] hover:translate-y-[-2px] active:scale-90"
          }`}
          title="الذكر السابق"
        >
          <ChevronUp size={28} strokeWidth={2.5} />
        </button>

        {/* Card Stack Deck Frame */}
        <div className="relative w-full h-[390px] flex items-center justify-center">
          {/* Layered Card 1 (Bottom stacked) */}
          <div className="absolute top-2 bottom-[-10px] inset-x-5 -z-10 cut-crystal-satin rounded-[28px] scale-[0.96] origin-bottom transition-all duration-300 pointer-events-none" />

          {/* Layered Card 2 (Bottom stacked further) */}
          <div className="absolute top-4 bottom-[-20px] inset-x-10 -z-20 cut-crystal-satin rounded-[28px] scale-[0.92] origin-bottom transition-all duration-300 pointer-events-none" />

          {/* Active Sliding Card */}
          <AnimatePresence custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              onClick={() => handleTap()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={(_event, info) => {
                const offsetY = info.offset.y;
                const velocityY = info.velocity.y;
                if (offsetY < -100 || velocityY < -500) {
                  handleNext();
                } else if (offsetY > 100 || velocityY > 500) {
                  handlePrev();
                }
              }}
              className="absolute inset-0 w-full h-full cut-crystal-satin p-6 md:p-8 rounded-[28px] shadow-lg flex flex-col justify-between cursor-pointer select-none overflow-hidden touch-none"
              style={{
                touchAction: "none",
              }}
            >
              {/* Sleek Top Edge Progress Indicator */}
              <div className="absolute top-0 inset-x-0 h-[4px] bg-[#ece7de] rounded-t-[28px] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#deab65] to-[#b88a4f]"
                  animate={{
                    width: `${Math.min((currentCount / item.count) * 100, 100)}%`,
                  }}
                  transition={{ duration: 0.25 }}
                />
              </div>

              {/* Top Progress Badge (Zikr sequence number) */}
              <div
                className="flex justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="px-4 py-0.5 rounded-full bg-[#fff8e1] text-[#b88a4f] text-[12px] font-bold tracking-tight tabular-nums border border-[#e6dccf]/60 shadow-sm">
                  {total} / {currentIndex + 1}
                </span>
              </div>

              {/* Scrollable text area with robust overflow vertical alignment */}
              <div className="flex-1 overflow-y-auto hide-scrollbar my-2.5 px-1.5 flex flex-col justify-start">
                <div className="my-auto py-2 w-full">
                  <p
                    className="text-center font-serif font-medium text-[#2b1a10] leading-relaxed select-text"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: "1.95",
                    }}
                  >
                    {item.text}
                  </p>

                  {/* Inline elegant source container */}
                  {showSource && item.source && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 text-center text-[12px] font-bold text-[#b88a4f] bg-[#fff8e1] px-4 py-2 rounded-xl border border-[#e6dccf]/45 leading-relaxed shadow-inner"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.source}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Elegant, smaller counter badge */}
              <div
                className="flex justify-center mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={`px-4 py-1.5 rounded-full flex items-center gap-2 border text-[13px] font-bold select-none transition-all duration-300 ${
                    isComplete
                      ? "bg-[#b88a4f]/15 border-transparent text-[#b88a4f] scale-95"
                      : "bg-[#fff8e1] border-[#e6dccf] text-[#2b1a10]"
                  }`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${isComplete ? "bg-[#b88a4f]" : "bg-[#deab65] animate-pulse"}`}
                  />
                  <span className="font-bold tabular-nums">
                    {currentCount} من {item.count}{" "}
                    {item.count > 10 ? "مرة" : "مرات"}
                  </span>
                </div>
              </div>

              {/* Thin Divider Line */}
              <div className="w-full h-[1px] bg-[#ece7de]/60 mb-2" />

              {/* Shrunken, low-profile actions row */}
              <div
                className="flex items-center justify-between px-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Source Info Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSource(!showSource);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 ${
                    showSource
                      ? "bg-[#b88a4f]/15 text-[#b88a4f]"
                      : "text-[#7f6a55] hover:text-[#2b1a10] hover:bg-black/5"
                  }`}
                >
                  <Info size={12} />
                  <span>المصدر</span>
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="p-1.5 text-[#7f6a55] hover:text-[#2b1a10] hover:bg-black/5 rounded-full transition-colors"
                  title="مشاركة الذكر"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Down Arrow (Next / Close if last) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="mt-1.5 flex h-8 w-12 items-center justify-center rounded-full text-[#7f6a55] hover:text-[#2b1a10] hover:translate-y-[2px] active:scale-90 transition-all duration-300"
          title={isLast ? "تمّت الأذكار" : "الذكر التالي"}
        >
          <ChevronDown size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── BOTTOM CONTROL ROW ── */}
      <footer className="flex items-center justify-between px-6 pt-2 pb-6 mt-1">
        {/* Font size changer "AA" */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            changeFontSize();
          }}
          className="flex h-11 w-11 items-center justify-center cut-crystal-capsule text-[#2b1a10] font-bold text-[14px] shadow-md active:scale-95"
          title="تغيير حجم الخط"
        >
          AA
        </button>

        {/* Auto Transition Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleAutoTransition();
          }}
          className={`px-5 py-2.5 cut-crystal-capsule font-bold text-[12.5px] shadow-sm flex items-center justify-center gap-2 ${
            autoTransition
              ? "bg-[#b88a4f] border-[#b88a4f] text-white shadow-[#b88a4f]/15"
              : "text-[#7f6a55] hover:text-[#2b1a10]"
          }`}
        >
          <div
            className={`h-1.5 w-1.5 rounded-full ${autoTransition ? "bg-white animate-pulse" : "bg-[#7f6a55]"}`}
          />
          <span>
            {autoTransition
              ? "إيقاف الانتقال التلقائي"
              : "تفعيل الانتقال التلقائي"}
          </span>
        </button>
      </footer>

      {/* ── PREMIUM TOAST FEEDBACK FLOATER ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.9 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#2b1a10]/95 text-[#ece7de] text-[13px] font-bold shadow-lg shadow-black/20 pointer-events-none"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
