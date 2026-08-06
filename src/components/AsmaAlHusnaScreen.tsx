import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useDeferredValue,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { asmaAlHusnaData, type AsmaName } from "@/data/asmaAlHusnaData";
import {
  Search,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  Quote,
  Info,
  Check,
  ArrowLeft,
} from "lucide-react";

type Props = {
  onClose: () => void;
};

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export default function AsmaAlHusnaScreen({ onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNameId, setSelectedNameId] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"main" | "favorites">("main");

  // Defer the active tab to prioritize the UI animation for tab switching
  const deferredTab = useDeferredValue(activeTab);
  const filterFavoritesOnly = deferredTab === "favorites";

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sakinah_asma_favorites");
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load favorites", e);
    }
  }, []);

  // Save favorites to localStorage
  const toggleFavorite = useCallback((id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id];
      try {
        localStorage.setItem("sakinah_asma_favorites", JSON.stringify(updated));
      } catch (err) {
        console.warn("Failed to save favorites", err);
      }
      return updated;
    });
  }, []);

  // "Name of the Day" based on the current day of the year
  const nameOfTheDay = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    // Index 1 to 99
    const id = (dayOfYear % 99) + 1;
    return asmaAlHusnaData.find((n) => n.id === id) || asmaAlHusnaData[0];
  }, []);

  // Filtered names based on search and favorite filters
  const filteredNames = useMemo(() => {
    return asmaAlHusnaData.filter((item) => {
      // 1. Favorite Filter
      if (filterFavoritesOnly && !favorites.includes(item.id)) return false;

      // 2. Search Query Filter
      if (!searchQuery.trim()) return true;
      const cleanQuery = searchQuery.trim().toLowerCase();

      const cleanArabic = item.name.replace(/[\u064B-\u0652]/g, ""); // Remove diacritics
      const matchName =
        item.name.toLowerCase().includes(cleanQuery) ||
        cleanArabic.includes(cleanQuery);
      const matchTranslit = item.transliteration
        .toLowerCase()
        .includes(cleanQuery);
      const matchTrans = item.translation.toLowerCase().includes(cleanQuery);

      return matchName || matchTranslit || matchTrans;
    });
  }, [searchQuery, filterFavoritesOnly, favorites]);

  // Selected Name Object
  const selectedName = useMemo(() => {
    if (selectedNameId === null) return null;
    return asmaAlHusnaData.find((n) => n.id === selectedNameId) || null;
  }, [selectedNameId]);

  // Handlers for Prev/Next
  const handlePrevName = useCallback(() => {
    if (selectedNameId === null) return;
    setSelectedNameId((prev) => (prev === 1 ? 99 : prev! - 1));
  }, [selectedNameId]);

  const handleNextName = useCallback(() => {
    if (selectedNameId === null) return;
    setSelectedNameId((prev) => (prev === 99 ? 1 : prev! + 1));
  }, [selectedNameId]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-[#ece7de] overflow-hidden font-sans flex flex-col h-full"
    >
      {/* ── FLOATING HEADER ── */}
      <div className="fixed top-6 left-6 right-6 flex items-center justify-between z-40 pointer-events-none">
        {/* Right Side (First in RTL): Title Capsule */}
        <div className="px-5 h-10 cut-crystal-capsule flex items-center justify-center pointer-events-auto">
          <span className="text-[13.5px] font-bold text-[#2b1a10] whitespace-nowrap pt-0.5">
            أسماء الله الحسنى
          </span>
        </div>

        {/* Left Side (Second in RTL): Exit/Back Button */}
        <button
          onClick={onClose}
          className="w-10 h-10 cut-crystal-capsule flex items-center justify-center text-[#2b1a10] active:scale-95 transition-all pointer-events-auto"
          aria-label="رجوع"
        >
          <ChevronRight size={20} className="mr-0.5" />
        </button>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto px-6 pt-24 pb-28 hide-scrollbar">
        {/* ── NAME OF THE DAY BANNER ── */}
        {!filterFavoritesOnly && !searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 relative text-center bg-gradient-to-br from-[#deab65] to-[#b88a4f] gem-rim-glow shadow-[0_16px_40px_rgba(184,138,79,0.25)] border border-[#c49a62]"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30" />
            <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 w-44 h-44 rounded-full bg-black/5 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/50" />
                <span className="text-[11px] font-bold text-white tracking-widest uppercase shadow-sm">
                  اسم اليوم المختار
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/50" />
              </div>

              <div
                onClick={() => setSelectedNameId(nameOfTheDay.id)}
                className="cursor-pointer group flex flex-col items-center w-full"
              >
                <span className="text-[40px] font-display font-bold text-white mb-3 group-active:scale-95 transition-transform drop-shadow-[0_2px_12px_rgba(0,0,0,0.1)] leading-tight">
                  {nameOfTheDay.name}
                </span>
                <p className="text-[13.5px] font-medium text-white/90 leading-relaxed max-w-[90%] mb-5 text-center">
                  {nameOfTheDay.meaning}
                </p>

                <div className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-[12px] font-bold text-white group-hover:bg-white/25 transition-all shadow-sm">
                  <span>تأمل في معاني الاسم</span>
                  <ChevronLeft size={14} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SEARCH BAR ── */}
        <div className="relative mb-5">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#7f6a55]/70">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن اسم باللغة العربية أو الإنجليزية..."
            className="w-full h-12 pr-11 pl-10 cut-crystal-input text-[#2b1a10] placeholder-[#7f6a55]/60 text-sm font-bold focus:outline-none focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 left-3 flex items-center px-2 text-[#7f6a55] hover:text-[#2b1a10]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── EMPTY STATES ── */}
        {filteredNames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#f7f2ea] border border-[#e6dccf] flex items-center justify-center mx-auto text-[#7f6a55] mb-3">
              <Info size={24} />
            </div>
            <h3 className="text-base font-bold text-[#2b1a10] mb-1">
              لا توجد نتائج مطابقة
            </h3>
            <p className="text-xs text-[#7f6a55] font-bold">
              جرّب البحث بكلمة أخرى أو تصفح القائمة الكاملة
            </p>
          </motion.div>
        )}

        {/* ── NAMES GRID ── */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {filteredNames.map((item, idx) => {
            const isFav = favorites.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedNameId(item.id)}
                className="cut-crystal-panel rounded-[26px] p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-95 transition-all min-h-[145px]"
              >
                {/* Card top */}
                <div className="flex items-start justify-between w-full">
                  {/* ID Badge */}
                  <span className="text-[10px] font-bold text-[#7f6a55]/60 font-mono">
                    #{item.id.toString().padStart(2, "0")}
                  </span>

                  {/* Favorite Heart Button */}
                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="p-1 rounded-full text-[#7f6a55]/40 hover:text-[#b88a4f] active:scale-125 transition-transform"
                    aria-label="تفضيل"
                  >
                    <Heart
                      size={15}
                      className={
                        isFav
                          ? "fill-current text-[#b88a4f]"
                          : "text-[#7f6a55]/40"
                      }
                    />
                  </button>
                </div>

                {/* Calligraphic Name rendering */}
                <div className="my-1.5 text-center">
                  <h3 className="text-[25px] font-display font-bold text-[#2b1a10] leading-tight drop-shadow-sm select-none">
                    {item.name}
                  </h3>
                </div>

                {/* Meaning Subtitles */}
                <div className="text-center w-full mt-1">
                  <p className="text-[11px] font-bold text-[#b88a4f] leading-none mb-0.5 truncate select-none">
                    {item.transliteration}
                  </p>
                  <p className="text-[10px] text-[#7f6a55] font-bold truncate opacity-85 select-none">
                    {item.translation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DETAILS MODAL/SLIDE-UP SCREEN ── */}
      <AnimatePresence>
        {selectedName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedNameId(null)}
          >
            {/* Modal Box */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-full max-w-[390px] cut-crystal-panel rounded-t-[32px] p-6 flex flex-col max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab indicator line */}
              <div className="w-12 h-1 bg-[#c4b5a3] rounded-full mx-auto mb-5 opacity-65" />

              {/* Modal Top Header (Close button & Navigation) */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedNameId(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dccf] bg-[#f7f2ea] text-[#7f6a55] active:scale-95 transition-transform"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#7f6a55] font-mono">
                    {selectedName.id} من 99
                  </span>
                  <button
                    onClick={() => toggleFavorite(selectedName.id)}
                    className="p-1.5 rounded-full text-[#7f6a55]/40 hover:text-[#b88a4f] active:scale-125 transition-transform"
                  >
                    <Heart
                      size={18}
                      className={
                        favorites.includes(selectedName.id)
                          ? "fill-current text-[#b88a4f]"
                          : "text-[#7f6a55]/40"
                      }
                    />
                  </button>
                </div>
              </div>

              {/* Main Medallion rendering of Selected Name */}
              <div className="text-center py-4 mb-4 rounded-3xl border border-white/40 bg-white/30 backdrop-blur-sm relative">
                {/* Decorative background vectors or shapes */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                  <Quote size={120} className="text-[#b88a4f]" />
                </div>

                <h2 className="text-[38px] font-display font-bold text-[#2b1a10] leading-none tracking-tight mb-2 select-none">
                  {selectedName.name}
                </h2>
                <p className="text-xs font-bold text-[#b88a4f] uppercase tracking-wider mb-1">
                  {selectedName.transliteration}
                </p>
                <p className="text-xs text-[#7f6a55] font-bold">
                  « {selectedName.translation} »
                </p>
              </div>

              {/* SCROLLABLE DETAILED CONTENT */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1 hide-scrollbar">
                {/* 1. MEANING DETAIL */}
                <div className="space-y-1.5">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-[#b88a4f]">
                    <Info size={13} />
                    <span>المعنى والبيان التفصيلي</span>
                  </h4>
                  <div className="cut-crystal-satin p-4 rounded-2xl shadow-sm">
                    <p className="text-[14px] text-[#2b1a10] leading-relaxed font-bold">
                      {selectedName.meaningDetail}
                    </p>
                  </div>
                </div>

                {/* 2. QURANIC PROOF */}
                {selectedName.proof && (
                  <div className="space-y-1.5">
                    <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-[#b88a4f]">
                      <Quote size={12} />
                      <span>الدليل والأثر من القرآن والسنة</span>
                    </h4>
                    <div className="cut-crystal-satin p-4 rounded-2xl text-center shadow-sm">
                      <p className="text-[16px] md:text-[18px] font-normal leading-relaxed text-[#593d18] font-quran select-text">
                        {selectedName.proof}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. REFLECTION */}
                <div className="space-y-1.5">
                  <h4 className="flex items-center gap-1.5 text-[12px] font-bold text-[#b88a4f]">
                    <BookOpen size={13} />
                    <span>كيف نتعبد ونعمل بهذا الاسم?</span>
                  </h4>
                  <div className="cut-crystal-satin p-4 rounded-2xl shadow-sm">
                    <p className="text-[13.5px] text-[#7f6a55] leading-relaxed font-bold">
                      {selectedName.reflection}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows inside details */}
              <div className="mt-5 pt-4 border-t border-[#e6dccf]/60 flex items-center justify-between gap-4">
                <button
                  onClick={handlePrevName}
                  className="flex-1 h-11 rounded-2xl border border-[#e6dccf] bg-[#f7f2ea] text-xs font-bold text-[#2b1a10] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                >
                  <ChevronRight size={16} />
                  <span>الاسم السابق</span>
                </button>
                <button
                  onClick={handleNextName}
                  className="flex-1 h-11 rounded-2xl border border-[#e6dccf] bg-[#f7f2ea] text-xs font-bold text-[#2b1a10] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                >
                  <span>الاسم التالي</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INTERNAL FLOATING NAVIGATION ── */}
      <nav className="fixed bottom-6 inset-x-6 z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-2 cut-crystal-capsule">
          {/* الصفحة الرئيسية Tab */}
          <button
            onClick={() => setActiveTab("main")}
            className={`relative flex items-center gap-2 rounded-full px-5 py-2 transition-all duration-200 ${
              activeTab === "main"
                ? "text-[#2b1a10]"
                : "text-[#2b1a10]/50 hover:bg-[#2b1a10]/5 hover:text-[#2b1a10]/70"
            }`}
          >
            {activeTab === "main" && (
              <motion.div
                layoutId="asmaTabIndicator"
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/95 to-white/75 shadow-[0_2px_10px_rgba(43,26,16,0.15),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-[#2b1a10]/12"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              <HomeIcon />
            </span>
            <div
              className={`relative z-10 overflow-hidden transition-all duration-200 ease-out ${activeTab === "main" ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"}`}
            >
              <span className="text-[13px] font-bold whitespace-nowrap pl-1">
                الرئيسية
              </span>
            </div>
          </button>

          {/* المفضلة Tab */}
          <button
            onClick={() => setActiveTab("favorites")}
            className={`relative flex items-center gap-2 rounded-full px-5 py-2 transition-all duration-200 ${
              activeTab === "favorites"
                ? "text-[#2b1a10]"
                : "text-[#2b1a10]/50 hover:bg-[#2b1a10]/5 hover:text-[#2b1a10]/70"
            }`}
          >
            {activeTab === "favorites" && (
              <motion.div
                layoutId="asmaTabIndicator"
                className="absolute inset-0 rounded-full bg-gradient-to-b from-white/95 to-white/75 shadow-[0_2px_10px_rgba(43,26,16,0.15),inset_0_1px_1.5px_rgba(255,255,255,1)] border border-[#2b1a10]/12"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              <Heart
                size={16}
                className={
                  activeTab === "favorites" ? "fill-current text-[#b88a4f]" : ""
                }
              />
            </span>
            <div
              className={`relative z-10 overflow-hidden transition-all duration-200 ease-out ${activeTab === "favorites" ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"}`}
            >
              <span className="text-[13px] font-bold whitespace-nowrap pl-1">
                المفضلة ({favorites.length})
              </span>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
}
