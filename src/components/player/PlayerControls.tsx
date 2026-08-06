import React from 'react';
import { SkipBack, SkipForward, Play, Pause, Shuffle } from 'lucide-react';

interface Props {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  shuffleMode?: boolean;
  onToggleShuffle?: () => void;
}

export function PlayerControls({ isPlaying, onTogglePlay, onPrev, onNext, shuffleMode, onToggleShuffle }: Props) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 my-8 z-0">
      <button 
        onClick={onToggleShuffle}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-transform active:scale-90 ${shuffleMode ? 'text-[#b88a4f]' : 'text-[#7f6a55]/60'}`}
      >
        <Shuffle size={20} />
      </button>

      <button 
        onClick={onPrev}
        className="w-14 h-14 flex items-center justify-center text-[#2b1a10] hover:text-[#b88a4f] active:scale-90 transition-transform"
      >
        <SkipBack size={32} fill="currentColor" />
      </button>
      
      {/* Play/Pause Main Button */}
      <button 
        onClick={onTogglePlay}
        className="
          w-[72px] h-[72px] 
          flex items-center justify-center 
          rounded-full 
          bg-gradient-to-br from-[#deab65] to-[#b88a4f] 
          text-white shadow-lg shadow-[#b88a4f]/25 border border-[#c49a62]
          active:scale-90 transition-transform
        "
      >
        {isPlaying ? (
          <Pause size={36} fill="white" />
        ) : (
          <Play size={36} fill="white" className="ml-1" />
        )}
      </button>
      
      {/* Next */}
      <button 
        onClick={onNext}
        className="w-14 h-14 flex items-center justify-center text-[#2b1a10] hover:text-[#b88a4f] active:scale-90 transition-transform"
      >
        <SkipForward size={32} fill="currentColor" />
      </button>

      <div className="w-12 h-12" /> {/* Spacer to balance the shuffle button */}
    </div>
  );
}

