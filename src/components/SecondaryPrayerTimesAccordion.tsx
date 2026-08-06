/**
 * SecondaryPrayerTimesAccordion — Duha, Midnight, Tahajjud timings
 * الأوقات الثانوية: الضحى، منتصف الليل، الثلث الأخير
 * 
 * Reference: IMG_20260716_172716_440.jpg
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SinglePrayerPreference, PrayerSettingsId } from '@/types/prayer-settings';

interface SecondaryTiming {
  id: PrayerSettingsId;
  name: string;
  time: string;
  meridiem: string;
  icon: React.ReactNode;
}

interface SecondaryPrayerTimesAccordionProps {
  preferences: Record<PrayerSettingsId, SinglePrayerPreference>;
  onToggleEnabled: (id: PrayerSettingsId, enabled: boolean) => void;
  onOpenSettings: (id: PrayerSettingsId) => void;
  /** Prayer schedule data for calculating secondary times */
  fajrTime?: Date;
  maghribTime?: Date;
  sunriseTime?: Date;
  ishaTime?: Date;
}

function formatTime(date: Date): { time: string; meridiem: string } {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const h12 = hours % 12 || 12;
  const mStr = minutes.toString().padStart(2, '0');
  const meridiem = hours >= 12 ? 'م' : 'ص';
  return { time: `${h12}:${mStr}`, meridiem };
}

export const SecondaryPrayerTimesAccordion = React.memo(function SecondaryPrayerTimesAccordion({
  preferences,
  onToggleEnabled,
  onOpenSettings,
  fajrTime,
  maghribTime,
  sunriseTime,
  ishaTime,
}: SecondaryPrayerTimesAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate secondary timings
  const secondaryTimings = useMemo<SecondaryTiming[]>(() => {
    const timings: SecondaryTiming[] = [];

    // Duha: 15 minutes after sunrise
    if (sunriseTime) {
      const duhaTime = new Date(sunriseTime.getTime() + 15 * 60 * 1000);
      const { time, meridiem } = formatTime(duhaTime);
      timings.push({
        id: 'duha',
        name: 'الضحى',
        time,
        meridiem,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ),
      });
    }

    // Midnight: halfway between Maghrib and Fajr
    if (maghribTime && fajrTime) {
      const maghribMs = maghribTime.getTime();
      let fajrMs = fajrTime.getTime();
      // If Fajr is before Maghrib, it's next day's Fajr
      if (fajrMs <= maghribMs) {
        fajrMs += 24 * 60 * 60 * 1000;
      }
      const midnightMs = maghribMs + (fajrMs - maghribMs) / 2;
      const midnightDate = new Date(midnightMs);
      const { time, meridiem } = formatTime(midnightDate);
      timings.push({
        id: 'midnight',
        name: 'منتصف الليل',
        time,
        meridiem,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ),
      });
    }

    // Tahajjud: Last third of the night (between Isha and Fajr)
    if (ishaTime && fajrTime) {
      const ishaMs = ishaTime.getTime();
      let fajrMs = fajrTime.getTime();
      if (fajrMs <= ishaMs) {
        fajrMs += 24 * 60 * 60 * 1000;
      }
      const nightDuration = fajrMs - ishaMs;
      const tahajjudMs = ishaMs + nightDuration * (2 / 3);
      const tahajjudDate = new Date(tahajjudMs);
      const { time, meridiem } = formatTime(tahajjudDate);
      timings.push({
        id: 'tahajjud',
        name: 'الثلث الأخير',
        time,
        meridiem,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 18a5 5 0 0 0-10 0" />
            <line x1="12" y1="9" x2="12" y2="2" />
            <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
            <line x1="1" y1="18" x2="3" y2="18" />
            <line x1="21" y1="18" x2="23" y2="18" />
            <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
            <line x1="23" y1="22" x2="1" y2="22" />
            <polyline points="8,6 12,2 16,6" />
          </svg>
        ),
      });
    }

    return timings;
  }, [sunriseTime, maghribTime, fajrTime, ishaTime]);

  return (
    <div dir="rtl">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 px-1 cursor-pointer group"
      >
        <span className="text-[14px] font-bold text-[#7f6a55] group-hover:text-[#2b1a10] transition-colors">
          أوقات أخرى
        </span>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f6a55" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-2">
              {secondaryTimings.map((timing) => {
                const pref = preferences[timing.id];
                if (!pref) return null;

                return (
                  <div
                    key={timing.id}
                    className="flex items-center justify-between rounded-[16px] bg-[#fdfcfb] border border-[#e6dccf]/50 px-4 py-3"
                  >
                    {/* Right: Icon + Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f7f2ea] flex items-center justify-center text-[#b88a4f]">
                        {timing.icon}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#2b1a10]">{timing.name}</p>
                      </div>
                    </div>

                    {/* Center: Time */}
                    <div className="text-[14px] font-black text-[#2b1a10] tabular-nums">
                      {timing.time}
                      <span className="mr-1 text-[11px] font-bold text-[#7f6a55]/60">{timing.meridiem}</span>
                    </div>

                    {/* Left: Toggle + Speaker */}
                    <div className="flex items-center gap-2">
                      {/* Mini toggle */}
                      <button
                        onClick={() => onToggleEnabled(timing.id, !pref.enabled)}
                        className="relative w-8 h-[1.125rem] rounded-full p-0.5 transition-colors duration-300 cursor-pointer flex items-center"
                        style={{
                          backgroundColor: pref.enabled ? '#b88a4f' : '#e6dccf',
                          justifyContent: pref.enabled ? 'flex-start' : 'flex-end',
                        }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
                      </button>

                      {/* Speaker icon */}
                      <button
                        onClick={() => onOpenSettings(timing.id)}
                        className="w-7 h-7 rounded-full bg-[#f7f2ea] flex items-center justify-center text-[#b88a4f] hover:bg-[#e6dccf] transition-colors cursor-pointer"
                        aria-label={`إعدادات ${timing.name}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
