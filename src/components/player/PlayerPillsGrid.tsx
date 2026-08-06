import React from 'react';
import { Clock, Repeat, Gauge, Sliders } from 'lucide-react';

interface Props {
  onOpenSpeed: () => void;
  onOpenTimer: () => void;
  onOpenRepeat: () => void;
  onOpenSettings: () => void;
  playbackRate: number;
  timerMinutesRemaining: number | null;
}

export function PlayerPillsGrid({ 
  onOpenSpeed, 
  onOpenTimer, 
  onOpenRepeat, 
  onOpenSettings,
  playbackRate,
  timerMinutesRemaining
}: Props) {
  return (
    <div className="max-w-[340px] mx-auto w-full grid grid-cols-2 gap-3 my-4 px-6 z-0">
      <button 
        onClick={onOpenTimer}
        className="
          flex items-center justify-center gap-2 
          py-3.5 px-4 rounded-full 
          player-glass-pill
          text-[12px] font-bold text-white
          hover:bg-white/15 active:scale-95 
          transition-all
        "
      >
        <Clock size={14} className={timerMinutesRemaining !== null ? "text-quranify-live animate-pulse" : "text-quranify-accent-primary"} />
        <span className="truncate">
          {timerMinutesRemaining !== null ? `${Math.ceil(timerMinutesRemaining)}د` : "المؤقت"}
        </span>
      </button>

      <button 
        onClick={onOpenRepeat}
        className="
          flex items-center justify-center gap-2 
          py-3.5 px-4 rounded-full 
          player-glass-pill
          text-[12px] font-bold text-white
          hover:bg-white/15 active:scale-95 
          transition-all
        "
      >
        <Repeat size={14} className="text-quranify-accent-primary" />
        <span>تكرار</span>
      </button>

      <button 
        onClick={onOpenSpeed}
        className="
          flex items-center justify-center gap-2 
          py-3.5 px-4 rounded-full 
          player-glass-pill
          text-[12px] font-bold text-white
          hover:bg-white/15 active:scale-95 
          transition-all
        "
      >
        <Gauge size={14} className="text-quranify-accent-primary" />
        <span>السرعة ({playbackRate}x)</span>
      </button>

      <button 
        onClick={onOpenSettings}
        className="
          flex items-center justify-center gap-2 
          py-3.5 px-4 rounded-full 
          player-glass-pill
          text-[12px] font-bold text-white
          hover:bg-white/15 active:scale-95 
          transition-all
        "
      >
        <Sliders size={14} className="text-quranify-accent-primary" />
        <span>أصوات</span>
      </button>
    </div>
  );
}
