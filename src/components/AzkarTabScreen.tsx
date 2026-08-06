import React, { useState, useEffect, useCallback } from "react";
import { hisnAlMuslimData, type HisnCategory } from "@/data/hisnAlMuslimData";
import { dailyTracker } from "@/data/dailyTracker";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Moon,
  MoonStar,
  Check,
  RefreshCw,
  ChevronLeft,
  BookOpen,
  Heart,
  Shield,
  CloudRain,
  MapPin,
  Home,
  Utensils,
  Car,
  BriefcaseMedical,
  AlertCircle,
  Sunrise,
  Coffee,
  User,
  Activity,
  Bell,
  Sparkles,
} from "lucide-react";

type Props = {
  onOpenAzkarCounter: (
    azkarType: "morning" | "evening" | "sleep" | "post_prayer",
  ) => void;
  onOpenHisnCategory: (category: string) => void;
  onOpenAsmaAlHusna: () => void;
};

// Map categories to high-quality lucide icons
const getHisnCategoryStyle = (category: string) => {
  const s = (Icon: any, bg: string) => ({
    icon: (
      <Icon
        size={20}
        className="text-white drop-shadow-sm"
        fill="currentColor"
        strokeWidth={1.5}
      />
    ),
    bg: `${bg} gem-rim-glow`,
  });
  if (category.includes("صباح"))
    return s(
      Sun,
      "bg-gradient-to-br from-[#deab65] to-[#b88a4f] shadow-sm border border-[#c49a62]",
    );
  if (category.includes("مساء"))
    return s(
      Moon,
      "bg-gradient-to-br from-[#8ca1b3] to-[#667a8c] shadow-sm border border-[#778d9e]",
    );
  if (category.includes("نوم"))
    return s(
      MoonStar,
      "bg-gradient-to-br from-[#8e859c] to-[#685f74] shadow-sm border border-[#7d748a]",
    );
  if (category.includes("استيقاظ"))
    return s(
      Sunrise,
      "bg-gradient-to-br from-[#deab65] to-[#b88a4f] shadow-sm border border-[#c49a62]",
    );
  if (
    category.includes("صلاة") ||
    category.includes("أذان") ||
    category.includes("مسجد")
  )
    return s(
      MapPin,
      "bg-gradient-to-br from-[#80a390] to-[#5a7d6a] shadow-sm border border-[#6e907e]",
    );
  if (category.includes("منزل") || category.includes("بيت"))
    return s(
      Home,
      "bg-gradient-to-br from-[#c49b7e] to-[#a3795c] shadow-sm border border-[#b58a6d]",
    );
  if (category.includes("خلاء") || category.includes("وضوء"))
    return s(
      Activity,
      "bg-gradient-to-br from-[#969fa8] to-[#737c85] shadow-sm border border-[#858e96]",
    );
  if (category.includes("طعام") || category.includes("شرب"))
    return s(
      Utensils,
      "bg-gradient-to-br from-[#c98e61] to-[#a86e42] shadow-sm border border-[#b87d52]",
    );
  if (category.includes("ثوب") || category.includes("لبس"))
    return s(
      User,
      "bg-gradient-to-br from-[#a68292] to-[#856171] shadow-sm border border-[#947181]",
    );
  if (category.includes("سفر") || category.includes("ركوب"))
    return s(
      Car,
      "bg-gradient-to-br from-[#7799ad] to-[#55768a] shadow-sm border border-[#668799]",
    );
  if (
    category.includes("هم") ||
    category.includes("حزن") ||
    category.includes("كرب")
  )
    return s(
      AlertCircle,
      "bg-gradient-to-br from-[#b87a7a] to-[#965858] shadow-sm border border-[#a66969]",
    );
  if (category.includes("استخارة") || category.includes("زواج"))
    return s(
      Heart,
      "bg-gradient-to-br from-[#a68292] to-[#856171] shadow-sm border border-[#947181]",
    );
  if (category.includes("مريض") || category.includes("مرض"))
    return s(
      BriefcaseMedical,
      "bg-gradient-to-br from-[#b87a7a] to-[#965858] shadow-sm border border-[#a66969]",
    );
  if (
    category.includes("شيطان") ||
    category.includes("دجال") ||
    category.includes("حفظ")
  )
    return s(
      Shield,
      "bg-gradient-to-br from-[#8e859c] to-[#685f74] shadow-sm border border-[#7d748a]",
    );
  if (
    category.includes("مطر") ||
    category.includes("رعد") ||
    category.includes("ريح")
  )
    return s(
      CloudRain,
      "bg-gradient-to-br from-[#7799ad] to-[#55768a] shadow-sm border border-[#668799]",
    );

  return s(
    BookOpen,
    "bg-gradient-to-br from-[#a3a88a] to-[#808567] shadow-sm border border-[#919778]",
  );
};

const AzkarTabScreen = React.memo(function AzkarTabScreen({
  onOpenAzkarCounter,
  onOpenHisnCategory,
  onOpenAsmaAlHusna,
}: Props) {
  const [taskStates, setTaskStates] = useState<Record<number, boolean>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hisnCategories, setHisnCategories] = useState<
    [HisnCategory, number][]
  >([]);

  const refreshState = useCallback(() => {
    const states: Record<number, boolean> = {};
    for (const task of dailyTracker.tasks) {
      states[task.id] = dailyTracker.isTaskDone(task.id);
    }
    setTaskStates(states);
    setCompletedCount(dailyTracker.getCompletedCount());
    setProgress(dailyTracker.getTodayProgress());
    setHisnCategories(hisnAlMuslimData.getCategoriesWithCount());
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const handleToggleTask = (taskId: number) => {
    dailyTracker.toggleTask(taskId);
    refreshState();
  };

  const mainCategories: {
    title: string;
    subtitle: string;
    type: "morning" | "evening" | "sleep" | "post_prayer";
    icon: React.ReactNode;
    bg: string;
  }[] = [
    {
      title: "أذكار الصباح",
      subtitle: "إشراقة يومك",
      type: "morning",
      icon: (
        <Sun
          size={22}
          className="text-white drop-shadow-sm"
          fill="currentColor"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-[#deab65] to-[#b88a4f] shadow-amber-700/20 border border-[#c49a62]",
    },
    {
      title: "أذكار المساء",
      subtitle: "ختام يومك",
      type: "evening",
      icon: (
        <Moon
          size={22}
          className="text-white drop-shadow-sm"
          fill="currentColor"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-[#8ca1b3] to-[#667a8c] shadow-slate-700/20 border border-[#778d9e]",
    },
    {
      title: "أذكار النوم",
      subtitle: "سكينة وراحة",
      type: "sleep",
      icon: (
        <MoonStar
          size={22}
          className="text-white drop-shadow-sm"
          fill="currentColor"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-[#8e859c] to-[#685f74] shadow-purple-900/20 border border-[#7d748a]",
    },
    {
      title: "بعد الصلاة",
      subtitle: "تمام العبادة",
      type: "post_prayer",
      icon: (
        <Bell
          size={22}
          className="text-white drop-shadow-sm"
          fill="currentColor"
          strokeWidth={1.5}
        />
      ),
      bg: "bg-gradient-to-br from-[#80a390] to-[#5a7d6a] shadow-teal-900/20 border border-[#6e907e]",
    },
  ];

  return (
    <div
      dir="rtl"
      className="bg-[#ece7de] min-h-screen w-full max-w-[390px] mx-auto overflow-y-auto overflow-x-hidden pt-24 pb-28 font-sans relative"
    >
      {/* Background soft ambient shapes clipped safely */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#b88a4f]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-[#deab65]/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* ── FLOATING TOP HEADER ── */}
      <div className="fixed top-6 inset-x-0 px-5 max-w-[390px] mx-auto h-10 flex items-center justify-between z-40 pointer-events-none">
        {/* Right Element (in RTL): Azkar Title Capsule */}
        <div className="cut-crystal-capsule px-5 h-10 rounded-full shadow-md flex items-center justify-center pointer-events-auto">
          <span className="text-[14.5px] font-bold text-[#2b1a10] whitespace-nowrap pt-0.5">
            الأذكار
          </span>
        </div>

        {/* Left Element: Reset / Refresh Button Capsule */}
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={refreshState}
          className="w-10 h-10 cut-crystal-capsule rounded-full flex items-center justify-center shadow-md text-[#2b1a10] hover:text-[#b88a4f] active:scale-95 transition-all pointer-events-auto cursor-pointer"
          title="تحديث وإعادة ضبط الأذكار"
          aria-label="تحديث وإعادة ضبط الأذكار"
        >
          <RefreshCw size={18} className="text-[#b88a4f]" />
        </motion.button>
      </div>

      {/* ── Asma Al-Husna Quick Banner ── */}
      <div className="px-5 mb-1 mt-1">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onOpenAsmaAlHusna}
          className="w-full p-4 cut-crystal-panel rounded-[26px] hover:scale-[1.01] transition-all shadow-md flex flex-row-reverse items-center justify-between group text-right min-h-[90px]"
        >
          <div className="flex-1 pr-4 pl-2 flex flex-col justify-center h-full space-y-1">
            <h3 className="text-[17px] font-bold text-[#2b1a10] leading-tight">
              أسماء الله الحسنى
            </h3>
            <p className="text-[12px] text-[#7f6a55] font-bold leading-relaxed">
              تعلّم، تدبّر وتعرّف على معاني الـ 99 اسماً
            </p>
          </div>
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#749b9e] to-[#4e7477] gem-rim-glow border border-[#5d8386] group-hover:scale-105 transition-transform duration-300">
            <Heart
              size={26}
              className="text-white drop-shadow-sm"
              fill="currentColor"
              strokeWidth={1.5}
            />
          </div>
        </motion.button>
      </div>

      {/* ── Main Categories Grid ── */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-10 mt-2">
        {mainCategories.map((cat, i) => (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileTap={{ scale: 0.96 }}
            key={cat.type}
            onClick={() => onOpenAzkarCounter(cat.type)}
            className="cut-crystal-panel rounded-[26px] p-4 flex flex-col justify-between min-h-[110px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-start justify-between w-full">
              <div
                className={`w-10 h-10 rounded-[12px] flex items-center justify-center gem-rim-glow ${cat.bg}`}
              >
                {cat.icon}
              </div>
            </div>

            <div className="text-right mt-3 w-full">
              <h2 className="text-[16px] font-bold text-[#2b1a10] leading-tight mb-0.5">
                {cat.title}
              </h2>
              <p className="text-[12px] text-[#7f6a55] font-bold">
                {cat.subtitle}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Daily Tracker ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10"
      >
        <div className="px-5 mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-[#2b1a10]">
            يوميات المسلم
          </h2>
          <span className="text-[12px] font-bold text-[#b88a4f] bg-[#f7f2ea] border border-[#e6dccf] px-3 py-1 rounded-full">
            {completedCount} / {dailyTracker.tasks.length}
          </span>
        </div>

        <div className="px-5 mb-5">
          <div className="w-full h-2.5 bg-[#e8dfd4] rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-[#b88a4f] rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse"></div>
            </motion.div>
          </div>
        </div>

        <div className="px-5">
          <div className="cut-crystal-satin overflow-hidden shadow-md">
            <AnimatePresence>
              {dailyTracker.tasks.map((task, idx) => {
                const done = taskStates[task.id] ?? false;
                const isLast = idx === dailyTracker.tasks.length - 1;
                return (
                  <motion.button
                    key={task.id}
                    layout
                    whileTap={{ backgroundColor: "rgba(230, 220, 207, 0.5)" }}
                    onClick={() => handleToggleTask(task.id)}
                    className="relative w-full p-4 flex items-center gap-4 transition-colors duration-200"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-inner ${
                        done
                          ? "bg-[#b88a4f] text-[#fdfcfb]"
                          : "bg-[#e8dfd4] text-[#7f6a55]"
                      }`}
                    >
                      {done ? (
                        <Check size={14} strokeWidth={3} />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#ddd2c4]"></div>
                      )}
                    </div>

                    <span
                      className={`text-[15px] font-bold flex-1 text-right transition-colors duration-300 ${
                        done
                          ? "text-[#7f6a55] line-through decoration-[#7f6a55]/40"
                          : "text-[#2b1a10]"
                      }`}
                    >
                      {task.text}
                    </span>

                    {!isLast && (
                      <div className="absolute bottom-0 left-0 right-14 h-[1px] bg-[#e6dccf]/60" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Hisn Al Muslim ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="px-5 mb-4">
          <h2 className="text-[20px] font-bold text-[#2b1a10]">حصن المسلم</h2>
          <p className="text-[13px] text-[#7f6a55] font-bold mt-1">
            أدعية وأذكار من السنة النبوية
          </p>
        </div>

        <div className="px-5">
          <div className="cut-crystal-panel rounded-[28px] overflow-hidden pb-2 shadow-md">
            {hisnCategories.map(([cat, count], idx) => {
              const style = getHisnCategoryStyle(cat);
              const isLast = idx === hisnCategories.length - 1;
              return (
                <button
                  key={cat}
                  onClick={() => onOpenHisnCategory(cat)}
                  className="relative w-full p-4 flex items-center gap-4 text-right transition-all duration-150 group hover:bg-[#e6dccf]/30 active:bg-[#e6dccf]/60"
                >
                  <div
                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${style.bg}`}
                  >
                    {style.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-[#2b1a10] leading-tight mb-0.5">
                      {cat}
                    </h3>
                    <p className="text-[12px] font-bold text-[#7f6a55]">
                      {count} ذكر
                    </p>
                  </div>

                  <div className="text-[#b88a4f] opacity-50 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </div>

                  {!isLast && (
                    <div className="absolute bottom-0 left-0 right-16 h-[1px] bg-[#e6dccf]/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default AzkarTabScreen;
