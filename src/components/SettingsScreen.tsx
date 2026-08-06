import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CalculationMethod, AsrSchool } from "@/utils/locationDetection";
import { calcMethodLabels, asrSchoolLabels } from "@/constants/prayerContent";
import {
  MapPin,
  Sliders,
  BookOpen,
  Check,
  Sparkles,
  ChevronDown,
  Compass,
  ChevronRight,
  Bell,
} from "lucide-react";

type SettingsScreenProps = {
  cityName: string;
  cityLat: number;
  cityLon: number;
  isAutoLocation: boolean;
  onToggleAutoLocation: (val: boolean) => void;
  calcMethod: CalculationMethod;
  asrSchool: AsrSchool;
  isAutoCalcMethod: boolean;
  isAutoAsrSchool: boolean;
  onToggleAutoCalcMethod: (val: boolean) => void;
  onToggleAutoAsrSchool: (val: boolean) => void;
  onChangeCalcMethod: (method: CalculationMethod) => void;
  onChangeAsrSchool: (school: AsrSchool) => void;
  isPrayerReminderEnabled: boolean;
  onTogglePrayerReminder: (val: boolean) => void;
  isPrePrayerReminderEnabled: boolean;
  onTogglePrePrayerReminder: (val: boolean) => void;
  onChangeLocation: () => void;
  onBack: () => void;

  // Sunnah reminders props
  isMulkReminderEnabled: boolean;
  onToggleMulkReminder: (val: boolean) => void;
  mulkReminderTime: string;
  onChangeMulkReminderTime: (time: string) => void;
  isBaqarahReminderEnabled: boolean;
  onToggleBaqarahReminder: (val: boolean) => void;
  baqarahReminderTime: string;
  onChangeBaqarahReminderTime: (time: string) => void;
};

const formatTime12h = (time24: string): string => {
  if (!time24) return "";
  const [hoursStr, minutesStr] = time24.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const ampm = hours >= 12 ? "م" : "ص";
  const hours12 = hours % 12 || 12;
  const minutesPad = minutes.toString().padStart(2, "0");
  return `${hours12}:${minutesPad} ${ampm}`;
};

// Elegant, fluid, spring-animated toggle switch
const Switch = React.memo(function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5.5 rounded-full p-0.5 transition-colors duration-300 focus:outline-none flex items-center shadow-inner cursor-pointer"
      style={{
        backgroundColor: checked ? "#b88a4f" : "#e6dccf",
        justifyContent: checked ? "flex-start" : "flex-end",
      }}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="w-4.5 h-4.5 rounded-full bg-white shadow-md border border-white"
      />
    </button>
  );
});

export const SettingsScreen = React.memo(function SettingsScreen({
  cityName,
  cityLat,
  cityLon,
  isAutoLocation,
  onToggleAutoLocation,
  calcMethod,
  asrSchool,
  isAutoCalcMethod,
  isAutoAsrSchool,
  onToggleAutoCalcMethod,
  onToggleAutoAsrSchool,
  onChangeCalcMethod,
  onChangeAsrSchool,
  isPrayerReminderEnabled,
  onTogglePrayerReminder,
  isPrePrayerReminderEnabled,
  onTogglePrePrayerReminder,
  onChangeLocation,
  onBack,

  // New props
  isMulkReminderEnabled,
  onToggleMulkReminder,
  mulkReminderTime,
  onChangeMulkReminderTime,
  isBaqarahReminderEnabled,
  onToggleBaqarahReminder,
  baqarahReminderTime,
  onChangeBaqarahReminderTime,
}: SettingsScreenProps) {
  // Section expand states
  const [isCalcExpanded, setIsCalcExpanded] = useState(false);
  const [isAsrExpanded, setIsAsrExpanded] = useState(false);

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-[390px] px-5 pt-24 pb-28 font-sans bg-[#ece7de] min-h-screen relative overflow-hidden"
    >
      {/* Background soft ambient shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#b88a4f]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-[#deab65]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── FLOATING TOP HEADER ── */}
      <div className="fixed top-6 left-5 right-5 flex items-center justify-between z-45 pointer-events-none">
        {/* Right Element (in RTL): Settings Capsule */}
        <div className="cut-crystal-capsule px-5 h-10 rounded-full shadow-md flex items-center justify-center pointer-events-auto">
          <span className="text-[14.5px] font-bold text-[#2b1a10] whitespace-nowrap pt-0.5">
            الإعدادات
          </span>
        </div>

        {/* Left Element: Back Button */}
        <button
          onClick={onBack}
          className="w-10 h-10 cut-crystal-capsule rounded-full flex items-center justify-center shadow-md text-[#2b1a10] active:scale-95 transition-transform pointer-events-auto cursor-pointer"
          aria-label="رجوع"
        >
          <ChevronRight size={20} className="mr-0.5" />
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        {/* ── SECTION 1: LOCATION SETTINGS ── */}
        <div className="cut-crystal-panel rounded-[26px] p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[#e6dccf]/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#b88a4f]">
                الموقع الجغرافي
              </span>
            </div>
            {isAutoLocation && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                تحديد نشط
              </span>
            )}
          </div>

          {/* Current City display */}
          <div className="flex items-center justify-between cut-crystal-satin rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#b88a4f]/10 text-[#b88a4f]">
                <MapPin size={18} strokeWidth={2} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#7f6a55]/80 leading-none">
                  الموقع الحالي المعتمد
                </p>
                <p className="text-[14.5px] font-bold text-[#2b1a10] leading-none mt-1.5">
                  {cityName}
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onChangeLocation}
              className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-gradient-to-b from-[#deab65] to-[#b88a4f] text-[11px] font-bold text-white hover:opacity-95 transition-opacity shadow-sm shadow-amber-900/10 cursor-pointer"
            >
              تغيير الموقع
            </motion.button>
          </div>

          {/* Auto Location toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#b88a4f]/10 text-[#b88a4f]">
                <Compass size={18} strokeWidth={2} />
              </div>
              <div className="text-right">
                <p className="text-[13.5px] font-bold text-[#2b1a10] leading-none">
                  تحديد الموقع التلقائي (GPS)
                </p>
                <p className="text-[10.5px] text-[#7f6a55]/80 font-bold mt-1.5">
                  تحديث الميقات والقبلة أينما كنت
                </p>
              </div>
            </div>
            <Switch checked={isAutoLocation} onChange={onToggleAutoLocation} />
          </div>

          {/* Lat/Lon indicators */}
          <div className="flex items-center justify-between bg-[#f7f2ea]/40 border border-[#e6dccf]/30 rounded-xl px-3.5 py-2 text-[10.5px] text-[#7f6a55]/95 font-bold">
            <span>خط العرض: {cityLat.toFixed(4)}</span>
            <span>خط الطول: {cityLon.toFixed(4)}</span>
          </div>
        </div>

        {/* ── SECTION 2: PRAYER CALCULATIONS ── */}
        <div className="cut-crystal-panel rounded-[26px] p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 mb-2 border-b border-[#e6dccf]/40 pb-3">
            <span className="text-[12px] font-bold text-[#b88a4f]">
              طريقة الحساب والشرع
            </span>
          </div>

          {/* Calculation Method row */}
          <div className="flex flex-col border-b border-[#e6dccf]/30 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b88a4f]/10 text-[#b88a4f]">
                  <Sliders size={18} strokeWidth={1.8} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold text-[#2b1a10]">
                      طريقة الحساب
                    </p>
                    {isAutoCalcMethod && (
                      <span className="rounded-full bg-[#b88a4f]/10 px-2 py-0.5 text-[9px] font-bold text-[#b88a4f] border border-[#b88a4f]/20">
                        تلقائي
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#7f6a55] font-bold">
                    {calcMethodLabels[calcMethod]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAutoCalcMethod}
                  onChange={onToggleAutoCalcMethod}
                />
                {!isAutoCalcMethod && (
                  <button
                    onClick={() => setIsCalcExpanded(!isCalcExpanded)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f2ea] border border-[#e6dccf] text-[#7f6a55] active:scale-90 transition-transform cursor-pointer"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${isCalcExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {!isAutoCalcMethod && isCalcExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="cut-crystal-panel rounded-xl p-2 space-y-1 shadow-inner">
                    {Object.entries(calcMethodLabels).map(([key, label]) => {
                      const isSelected = calcMethod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onChangeCalcMethod(key as CalculationMethod);
                            setIsCalcExpanded(false);
                          }}
                          className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#b88a4f] text-white shadow-sm"
                              : "text-[#2b1a10] hover:bg-[#b88a4f]/5"
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && (
                            <Check size={14} className="text-current" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Asr School row */}
          <div className="flex flex-col pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b88a4f]/10 text-[#b88a4f]">
                  <BookOpen size={18} strokeWidth={1.8} />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold text-[#2b1a10]">
                      المذهب الفقهي (العصر)
                    </p>
                    {isAutoAsrSchool && (
                      <span className="rounded-full bg-[#b88a4f]/10 px-2 py-0.5 text-[9px] font-bold text-[#b88a4f] border border-[#b88a4f]/20">
                        تلقائي
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#7f6a55] font-bold">
                    {asrSchool === "STANDARD" ? "الجمهور" : "الحنفي"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isAutoAsrSchool}
                  onChange={onToggleAutoAsrSchool}
                />
                {!isAutoAsrSchool && (
                  <button
                    onClick={() => setIsAsrExpanded(!isAsrExpanded)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f7f2ea] border border-[#e6dccf] text-[#7f6a55] active:scale-90 transition-transform cursor-pointer"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${isAsrExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {!isAutoAsrSchool && isAsrExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="cut-crystal-panel rounded-xl p-2 space-y-1 shadow-inner">
                    {Object.entries(asrSchoolLabels).map(([key, label]) => {
                      const isSelected = asrSchool === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onChangeAsrSchool(key as AsrSchool);
                            setIsAsrExpanded(false);
                          }}
                          className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#b88a4f] text-white shadow-sm"
                              : "text-[#2b1a10] hover:bg-[#b88a4f]/5"
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && (
                            <Check size={14} className="text-current" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── SECTION 3: SUNNAH REMINDERS ── */}
        <div className="cut-crystal-panel rounded-[26px] p-5 space-y-4 shadow-md">
          <div className="flex items-center gap-2 mb-2 border-b border-[#e6dccf]/40 pb-3">
            <span className="text-[12px] font-bold text-[#b88a4f]">
              منبهات السنن والقرآن
            </span>
          </div>

          {/* Surah Al-Mulk Group */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${isMulkReminderEnabled ? "bg-[#b88a4f]/10 text-[#b88a4f]" : "bg-[#e6dccf]/20 text-[#7f6a55]"}`}
                >
                  <Bell size={18} strokeWidth={2} />
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-[#2b1a10]">
                    منبه سورة الملك
                  </p>
                  <p className="text-[11.5px] text-[#7f6a55] font-bold">
                    تنبيه يومي لقراءة السورة المنجية
                  </p>
                </div>
              </div>
              <Switch
                checked={isMulkReminderEnabled}
                onChange={onToggleMulkReminder}
              />
            </div>

            <div className="relative flex items-center justify-between px-1 py-1">
              <span
                className={`text-[13px] font-bold transition-colors duration-300 ${isMulkReminderEnabled ? "text-[#2b1a10]" : "text-[#7f6a55]/60"}`}
              >
                وقت التنبيه
              </span>
              <div className="relative">
                <span
                  className={`text-[13.5px] font-bold transition-colors duration-300 ${
                    isMulkReminderEnabled
                      ? "text-[#b88a4f]"
                      : "text-[#7f6a55]/40"
                  }`}
                >
                  {formatTime12h(mulkReminderTime)}
                </span>
                {isMulkReminderEnabled && (
                  <input
                    type="time"
                    value={mulkReminderTime}
                    onChange={(e) => onChangeMulkReminderTime(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#e6dccf]/30 my-2" />

          {/* Surah Al-Baqarah Group */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${isBaqarahReminderEnabled ? "bg-[#b88a4f]/10 text-[#b88a4f]" : "bg-[#e6dccf]/20 text-[#7f6a55]"}`}
                >
                  <Bell size={18} strokeWidth={2} />
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-bold text-[#2b1a10]">
                    منبه سورة البقرة
                  </p>
                  <p className="text-[11.5px] text-[#7f6a55] font-bold">
                    تنبيه يومي لقراءة سورة البركة
                  </p>
                </div>
              </div>
              <Switch
                checked={isBaqarahReminderEnabled}
                onChange={onToggleBaqarahReminder}
              />
            </div>

            <div className="relative flex items-center justify-between px-1 py-1">
              <span
                className={`text-[13px] font-bold transition-colors duration-300 ${isBaqarahReminderEnabled ? "text-[#2b1a10]" : "text-[#7f6a55]/60"}`}
              >
                وقت التنبيه
              </span>
              <div className="relative">
                <span
                  className={`text-[13.5px] font-bold transition-colors duration-300 ${
                    isBaqarahReminderEnabled
                      ? "text-[#b88a4f]"
                      : "text-[#7f6a55]/40"
                  }`}
                >
                  {formatTime12h(baqarahReminderTime)}
                </span>
                {isBaqarahReminderEnabled && (
                  <input
                    type="time"
                    value={baqarahReminderTime}
                    onChange={(e) =>
                      onChangeBaqarahReminderTime(e.target.value)
                    }
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: ABOUT THE APPLICATION ── */}
        <div className="cut-crystal-panel rounded-[26px] p-5 text-center relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#b88a4f]/5 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />

          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fdfcfb] to-[#f7f2ea] text-[#b88a4f] border border-white shadow-sm">
              <Sparkles
                size={24}
                className="text-[#b88a4f]"
                fill="currentColor"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <h3 className="text-[20px] font-display font-black text-[#2b1a10]">
            سَكِينَة
          </h3>
          <p className="text-[11.5px] text-[#7f6a55] font-bold mt-0.5">
            منصة إسلامية متكاملة للسلام الداخلي
          </p>
          <p className="text-[11px] font-mono font-bold text-[#b88a4f] tracking-wider mt-2 bg-[#b88a4f]/5 inline-block px-3 py-1 rounded-full border border-[#b88a4f]/15">
            النسخة v3.3
          </p>

          <div className="mt-4 border-t border-[#e6dccf]/40 pt-4 flex flex-col items-center">
            <p className="text-[16px] md:text-[18px] text-[#2b1a10]/90 font-normal italic animate-pulse font-quran select-text">
              "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ"
            </p>
            <span className="text-[10px] text-[#7f6a55] font-bold mt-1">
              سورة الرعد - الآية ٢٨
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
