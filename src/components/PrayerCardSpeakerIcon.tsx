/**
 * PrayerCardSpeakerIcon — Dynamic speaker icon showing notification state
 * أيقونة السبيكر الديناميكية على بطاقة الصلاة
 * 
 * Visual States (matching screenshots):
 * - beep:         Normal speaker with sound waves
 * - azan_short/full: Muezzin/minaret figure icon  
 * - vibrate_only: Phone with vibration waves
 * - silent/disabled: Muted speaker with slash
 */
import React from 'react';
import type { PrayerNotificationMode } from '@/types/prayer-settings';

interface PrayerCardSpeakerIconProps {
  mode: PrayerNotificationMode;
  enabled: boolean;
  isActive: boolean;  // Whether this prayer row is the current active prayer
  onClick: () => void;
}

export const PrayerCardSpeakerIcon = React.memo(function PrayerCardSpeakerIcon({
  mode,
  enabled,
  isActive,
  onClick,
}: PrayerCardSpeakerIconProps) {
  // Determine effective mode (if disabled, treat as silent)
  const effectiveMode: PrayerNotificationMode = !enabled ? 'silent' : mode;

  const iconColor = isActive ? '#b88a4f' : '#b88a4f';
  const iconSize = 20;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
      style={{
        backgroundColor: isActive ? 'rgba(184,138,79,0.15)' : 'rgba(184,138,79,0.08)',
      }}
      aria-label={`إعدادات الإشعار — ${effectiveMode === 'silent' ? 'صامت' : effectiveMode === 'vibrate_only' ? 'اهتزاز' : effectiveMode === 'beep' ? 'تنبيه' : 'أذان'}`}
    >
      {effectiveMode === 'beep' && (
        // Speaker with sound waves — Screenshot_20260716_181308.jpg
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      )}

      {effectiveMode === 'azan_short' && (
        // Azan waves icon — Screenshot_20260716_181405.jpg
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          {/* Minaret top indicator */}
          <circle cx="20" cy="5" r="1.5" fill={iconColor} stroke="none" />
        </svg>
      )}

      {effectiveMode === 'azan_full' && (
        // Full Azan — Muezzin figure silhouette — Screenshot_20260716_181405.jpg
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Muezzin figure */}
          <circle cx="12" cy="4" r="2" fill={iconColor} stroke="none" />
          <path d="M12 6 L12 14" />
          <path d="M12 8 L8 11" />
          <path d="M12 8 L16 11" />
          <path d="M12 14 L9 19" />
          <path d="M12 14 L15 19" />
          {/* Sound waves from figure */}
          <path d="M17 7 a4 4 0 0 1 0 6" opacity="0.6" />
          <path d="M19 5 a7 7 0 0 1 0 10" opacity="0.4" />
        </svg>
      )}

      {effectiveMode === 'vibrate_only' && (
        // Vibrate phone icon — Screenshot_20260716_184312.jpg
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Phone body */}
          <rect x="7" y="3" width="10" height="18" rx="2" />
          {/* Vibration waves on both sides */}
          <path d="M4 8 L2 10 L4 12" />
          <path d="M4 6 L1 9 L4 12" opacity="0.5" />
          <path d="M20 8 L22 10 L20 12" />
          <path d="M20 6 L23 9 L20 12" opacity="0.5" />
        </svg>
      )}

      {effectiveMode === 'silent' && (
        // Muted speaker — Screenshot_٢٠٢٦٠٧١٦_١٨٤٤٣٣.jpg
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
});
