import React, { useState, useEffect } from 'react';
import { Volume1, Volume2 } from 'lucide-react';

interface Props {
  volume: number;
  onVolumeChange: (volume: number) => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export function PlayerVolumeSlider({ volume, onVolumeChange, audioRef }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    if (!isDragging) {
      setLocalVolume(volume);
    }
  }, [volume, isDragging]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalVolume(val);
    if (audioRef?.current) {
      audioRef.current.volume = val;
    }
  };

  const handleVolumeCommit = () => {
    setIsDragging(false);
    onVolumeChange(localVolume);
  };

  return (
    <div className="px-8 mb-4 z-0" dir="ltr">
      <div className="flex items-center gap-4">
        <Volume1 size={20} className="text-quranify-text-secondary" />
        <div className="relative flex-1 h-11 flex items-center group touch-none">
          {/* Track */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-quranify-text-primary rounded-full transition-none"
              style={{ width: `${localVolume * 100}%` }}
            />
          </div>
          {/* Thumb */}
          <div 
            className={`absolute w-3 h-3 bg-white rounded-full shadow-md transition-transform ${isDragging ? "scale-125" : "group-hover:scale-110"}`}
            style={{ left: `calc(${localVolume * 100}% - 6px)` }}
          />
          {/* Input */}
          <input 
            type="range" 
            min={0} 
            max={1} 
            step={0.01}
            value={localVolume}
            onChange={handleVolumeChange}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            onMouseUp={handleVolumeCommit}
            onTouchEnd={handleVolumeCommit}
            onPointerCancel={handleVolumeCommit}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none"
          />
        </div>
        <Volume2 size={18} className="text-quranify-text-primary" />
      </div>
    </div>
  );
}
