import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronLeft, Check, Search, X, BookOpen, Bookmark, Trash2 } from "lucide-react";
import { surahMetadataList } from "@/data/quranTextDb";
import { vocalizedSurahNames } from "@/data/vocalizedSurahNames";

interface Props {
  onReadSurah: (surahId: number, initialPage?: number) => void;
  onModeChange: (mode: "listening" | "reading") => void;
}

const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305, 20: 312,
  21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467,
  41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518,
  51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542, 59: 545, 60: 549,
  61: 551, 62: 553, 63: 554, 64: 556, 65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568,
  71: 570, 72: 572, 73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585,
  81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593, 90: 594,
  91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603,
  111: 603, 112: 604, 113: 604, 114: 604
};

const toArabicDigits = (num: any): string => {
  if (num === undefined || num === null) return "";
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().replace(/[0-9]/g, (w: any) => arabicDigits[+w]);
};

export default function QuranReadingGatewayScreen({ onReadSurah, onModeChange }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "meccan" | "medinan">("all");
  const [activeTab, setActiveTab] = useState<"surahs" | "bookmarks">("surahs");
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Load bookmarks
  const loadBookmarks = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("sakina_quran_bookmarks") || "[]");
      setBookmarks(saved);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [activeTab]);

  const deleteBookmark = (id: string) => {
    try {
      const saved = JSON.parse(localStorage.getItem("sakina_quran_bookmarks") || "[]");
      const filtered = saved.filter((b: any) => b.id !== id);
      localStorage.setItem("sakina_quran_bookmarks", JSON.stringify(filtered));
      setBookmarks(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter surahs dynamically
  const filteredSurahs = useMemo(() => {
    return surahMetadataList.filter((surah) => {
      const matchesSearch = 
        surah.name.includes(searchQuery.trim()) || 
        surah.englishName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        surah.id.toString() === searchQuery.trim();

      const matchesType = 
        selectedTypeFilter === "all" ||
        (selectedTypeFilter === "meccan" && surah.type === "مكية") ||
        (selectedTypeFilter === "medinan" && surah.type === "مدنية");

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedTypeFilter]);

  // Total count of matching surahs formatted beautifully
  const statsLabel = useMemo(() => {
    const count = filteredSurahs.length;
    if (selectedTypeFilter === "meccan") {
      return `${toArabicDigits(count)} مكية`;
    } else if (selectedTypeFilter === "medinan") {
      return `${toArabicDigits(count)} مدنية`;
    }
    return `${toArabicDigits(count)} سورة`;
  }, [filteredSurahs, selectedTypeFilter]);

  return (
    <div className="min-h-screen bg-[#ece7de] text-[#2b1a10] flex flex-col font-[Cairo] relative overflow-hidden" dir="rtl">
      {/* Background soft ambient shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-[#b88a4f]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-[#deab65]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating Top Elements */}
      <div className="fixed top-6 left-6 right-6 flex items-center justify-between z-40 pointer-events-none">
        {/* Right Element (in RTL): Quran Capsule with Apple UI Dropdown */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="bg-[#f7f2ea]/95 backdrop-blur-md px-4.5 h-10 rounded-full shadow-[0_8px_24px_rgba(43,26,16,0.08)] border border-[#e6dccf] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97] hover:bg-[#fdfcfb]"
          >
            <span className="text-[14px] font-black text-[#2b1a10] whitespace-nowrap pt-0.5">القرآن الكريم</span>
            <ChevronDown size={14} className={`text-[#b88a4f] transition-transform duration-200 ${isModeDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Mode Dropdown */}
          <AnimatePresence>
            {isModeDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30 cursor-default" 
                  onClick={() => setIsModeDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-44 bg-[#fdfcfb]/95 backdrop-blur-xl rounded-[20px] border border-[#e6dccf] shadow-[0_12px_28px_rgba(43,26,16,0.12)] z-40 overflow-hidden py-1"
                >
                  <button
                    onClick={() => {
                      setIsModeDropdownOpen(false);
                      onModeChange("listening");
                    }}
                    className="w-full flex items-center justify-between py-2.5 px-4 text-right transition-colors hover:bg-[#e8dfd4]/45 text-[#2b1a10]"
                  >
                    <span className="text-[13px] font-bold">الاستماع</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsModeDropdownOpen(false);
                      onModeChange("reading");
                    }}
                    className="w-full flex items-center justify-between py-2.5 px-4 text-right transition-colors hover:bg-[#e8dfd4]/45 text-[#2b1a10]"
                  >
                    <span className="text-[13px] font-black text-[#b88a4f]">القرآن الكريم</span>
                    <Check size={14} className="text-[#b88a4f] shrink-0" />
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Left Element: Quick stats dropdown indicator for filters */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="bg-[#f7f2ea]/95 backdrop-blur-md px-4 h-10 rounded-full shadow-[0_8px_24px_rgba(43,26,16,0.08)] border border-[#e6dccf] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.97] hover:bg-[#fdfcfb]"
          >
            <span className="text-[12.5px] text-[#7f6a55] font-bold whitespace-nowrap pt-0.5">{statsLabel}</span>
            <ChevronDown size={14} className={`text-[#b88a4f] transition-transform duration-200 ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Filter Dropdown */}
          <AnimatePresence>
            {isFilterDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30 cursor-default" 
                  onClick={() => setIsFilterDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="absolute left-0 mt-2 w-36 bg-[#fdfcfb]/95 backdrop-blur-xl rounded-[20px] border border-[#e6dccf] shadow-[0_12px_28px_rgba(43,26,16,0.12)] z-40 overflow-hidden py-1"
                >
                  {[
                    { id: "all", label: "الكل" },
                    { id: "meccan", label: "مكية" },
                    { id: "medinan", label: "مدنية" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedTypeFilter(opt.id as any);
                        setIsFilterDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between py-2.5 px-4 text-right transition-colors hover:bg-[#e8dfd4]/45 text-[#2b1a10]"
                    >
                      <span className={`text-[13px] ${selectedTypeFilter === opt.id ? "font-black text-[#b88a4f]" : "font-medium"}`}>
                        {opt.label}
                      </span>
                      {selectedTypeFilter === opt.id && <Check size={14} className="text-[#b88a4f] shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-6 pb-36 pt-24 hide-scrollbar" dir="rtl">
        {/* Sliding Switcher / Tab (تويب متنقل) */}
        <div className="flex justify-center mb-8 relative z-10">
          <div className="bg-[#f2ebd9]/90 backdrop-blur-md p-1 rounded-full flex gap-1 border border-[#e6dccf] w-full max-w-[280px] shadow-sm">
            <button
              onClick={() => setActiveTab("surahs")}
              className={`flex-1 py-1.5 text-[14px] font-bold rounded-full transition-all duration-300 relative ${
                activeTab === "surahs"
                  ? "bg-[#b88a4f] text-white shadow-sm font-black"
                  : "text-[#7f6a55] hover:text-[#2b1a10]"
              }`}
            >
              سور القرآن
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex-1 py-1.5 text-[14px] font-bold rounded-full transition-all duration-300 relative ${
                activeTab === "bookmarks"
                  ? "bg-[#b88a4f] text-white shadow-sm font-black"
                  : "text-[#7f6a55] hover:text-[#2b1a10]"
              }`}
            >
              علامات مرجعية
            </button>
          </div>
        </div>

        {/* Display Active Tab Content */}
        {activeTab === "surahs" ? (
          <>
            {filteredSurahs.length === 0 ? (
              <div className="text-center py-20 text-[#7f6a55] font-bold relative z-10">
                لا توجد نتائج مطابقة لبحثك
              </div>
            ) : (
              <div className="space-y-2 relative z-10">
                {filteredSurahs.map((surah) => {
                  return (
                    <button
                      key={surah.id}
                      onClick={() => onReadSurah(surah.id)}
                      className="w-full h-[60px] md:h-[64px] bg-[#fdfcfb]/90 backdrop-blur-md hover:bg-[#f5ebd6]/60 border border-[#e6dccf] hover:border-[#c49a62]/50 rounded-[28px] pl-3 pr-4 md:pl-4 md:pr-5 flex items-center justify-between group active:scale-[0.99] transition-all duration-200 shadow-[0_2px_10px_rgba(43,26,16,0.015)]"
                    >
                      {/* Right Side: Ornament & Calligraphy Name */}
                      <div className="flex items-center gap-2 md:gap-2.5 min-w-0 flex-shrink">
                        {/* Rub el Hizb 8-pointed Star Ornament */}
                        <div className="relative w-[34px] h-[34px] flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-[#b88a4f] transition-transform duration-500 group-hover:rotate-[45deg]" strokeWidth="1.2">
                            {/* Outer 8-pointed star */}
                            <path d="M12 2 L15 5 L19 5 L19 9 L22 12 L19 15 L19 19 L15 19 L12 22 L9 19 L5 19 L5 15 L2 12 L5 9 L5 5 L9 5 Z" />
                            {/* Inner 8-pointed star */}
                            <path d="M12 5 L14.1 7.1 L17 7.1 L17 10 L19.1 12 L17 14.1 L17 17 L14.1 17 L12 19.1 L9.9 17 L7 17 L7 14.1 L4.9 12 L7 9.9 L7 7.1 L9.9 7.1 Z" strokeWidth="0.9" />
                            {/* Inner circle */}
                            <circle cx="12" cy="12" r="3" strokeWidth="0.8" />
                            {/* Center solid dot */}
                            <circle cx="12" cy="12" r="1" className="fill-[#b88a4f]" />
                          </svg>
                        </div>

                        {/* Vocalized Surah Calligraphy Name */}
                        <span className="font-quran text-[19px] md:text-[21px] text-[#2b1a10] group-hover:text-[#b88a4f] transition-colors leading-none pt-1 select-none whitespace-nowrap truncate font-normal">
                          {vocalizedSurahNames[surah.id] || `سُورَةُ ${surah.name}`}
                        </span>
                      </div>

                      {/* Left Side: Metadata, Verses Badge, and Arrow */}
                      <div className="flex items-center shrink-0 gap-1 md:gap-1.5 ml-0.5 md:ml-1">
                        {/* Metadata: Type | Page */}
                        <span className="text-[7.5px] md:text-[8px] text-[#8a7662] font-black whitespace-nowrap select-none font-[Cairo] pt-[1.5px] mr-1 md:mr-2">
                          {surah.type === "مكية" ? "مكية" : "مدنية"}
                          <span className="mx-0.5 md:mx-1 opacity-30 font-normal">|</span>
                          صفحة {SURAH_START_PAGES[surah.id] || 1}
                        </span>

                        {/* Verses Count Pill Badge */}
                        <div className="bg-[#b88a4f]/10 text-[#b88a4f] rounded-full px-2 h-[20px] flex items-center justify-center text-[7.5px] md:text-[8px] font-black whitespace-nowrap select-none font-[Cairo] shadow-sm -mt-[1px]">
                          {surah.versesCount} آية
                        </div>

                        {/* Chevron Arrow */}
                        <ChevronLeft size={14} className="text-[#7f6a55]/60 group-hover:text-[#b88a4f] group-hover:-translate-x-0.5 transition-all duration-200 shrink-0 ml-[-2px] md:ml-[-4px]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Bookmarks Tab Content */
          <div className="space-y-2 relative z-10">
            {bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 px-6 text-[#7f6a55] relative z-10">
                <BookOpen size={48} className="text-[#b88a4f] opacity-35 mb-4 animate-pulse" />
                <span className="font-bold text-[14.5px] text-[#2b1a10] mb-1">لا توجد علامات مرجعية محفوظة</span>
                <p className="text-[12.5px] max-w-[280px] leading-relaxed opacity-80">
                  أثناء قراءتك للمصحف الشريف، يمكنك حفظ صفحة كاملة أو آية معينة بالضغط عليها لتظهر هنا للرجوع السريع.
                </p>
              </div>
            ) : (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="w-full h-[64px] bg-[#fdfcfb]/90 backdrop-blur-md hover:bg-[#f5ebd6]/60 border border-[#e6dccf] hover:border-[#c49a62]/50 rounded-[28px] pl-3 pr-4 md:pl-4 md:pr-5 flex items-center justify-between group active:scale-[0.99] transition-all duration-200 shadow-sm"
                >
                  <button
                    onClick={() => onReadSurah(b.surahId, b.page)}
                    className="flex-1 h-full flex items-center justify-between text-right"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#b88a4f]/10 flex items-center justify-center text-[#b88a4f] shrink-0">
                        {b.type === "page" ? <BookOpen size={18} /> : <Bookmark size={18} fill="currentColor" />}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[14px] font-black text-[#2b1a10] line-clamp-1">
                          سُورَةُ {b.surahName}
                        </span>
                        <span className="text-[11px] text-[#7f6a55] font-bold">
                          {b.type === "page" 
                            ? `الصفحة ${toArabicDigits(b.page)}` 
                            : `الآية ${toArabicDigits(b.verseNumber)} (صفحة ${toArabicDigits(b.page)})`}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft size={14} className="text-[#7f6a55]/60 group-hover:text-[#b88a4f] group-hover:-translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBookmark(b.id);
                    }}
                    className="p-2 mr-2 rounded-full hover:bg-red-500/10 text-[#7f6a55] hover:text-red-500 transition-colors z-10"
                    title="حذف العلامة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Morphing Search Bar - Only show when Surahs tab is active */}
      {activeTab === "surahs" && (
        <div className="fixed bottom-28 left-6 right-6 z-30 pointer-events-none flex justify-start" dir="ltr">
          <motion.div
            animate={{
              width: isSearchActive ? "100%" : 56,
              borderRadius: 28,
              backgroundColor: isSearchActive ? "rgba(253, 252, 251, 0.95)" : "rgba(247, 242, 234, 0.9)",
              borderColor: isSearchActive ? "rgba(230, 220, 207, 0.6)" : "rgba(230, 220, 207, 1)",
            }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="h-14 shadow-[0_8px_32px_rgba(43,26,16,0.12)] backdrop-blur-xl border flex items-center overflow-hidden pointer-events-auto relative"
          >
            {/* Left Side (in LTR): Toggle Button (Search -> Close) */}
            <button
              onClick={() => {
                if (isSearchActive) {
                  setIsSearchActive(false);
                  setSearchQuery("");
                } else {
                  setIsSearchActive(true);
                }
              }}
              className="w-14 h-14 shrink-0 flex items-center justify-center transition-colors z-10"
            >
              <AnimatePresence mode="wait">
                {isSearchActive ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X size={20} className="text-[#7f6a55] hover:text-[#2b1a10]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Search size={20} className="text-[#b88a4f]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Input field (RTL) */}
            <div className={`flex-1 h-full relative flex items-center transition-opacity duration-200 ${isSearchActive ? "opacity-100" : "opacity-0"}`} dir="rtl">
              <input
                ref={(el) => {
                  if (el && isSearchActive && document.activeElement !== el) {
                    el.focus();
                  }
                }}
                type="text"
                placeholder="البحث عن سورة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none text-[15px] font-[Cairo] font-bold text-[#2b1a10] placeholder:text-[#7f6a55] px-2 pt-0.5"
                tabIndex={isSearchActive ? 0 : -1}
              />
            </div>
            
            {/* Decorative Search Icon when expanded */}
            <div className={`w-12 h-14 shrink-0 flex items-center justify-center transition-opacity duration-200 ${isSearchActive ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <Search size={18} className="text-[#b88a4f]/50" />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
