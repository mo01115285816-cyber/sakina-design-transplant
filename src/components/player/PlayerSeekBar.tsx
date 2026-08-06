import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export function PlayerSeekBar({ currentTime, duration, onSeek, audioRef }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalProgress(val);
    if (audioRef?.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleSeekCommit = () => {
    setIsDragging(false);
    onSeek(localProgress);
  };

  const safeDuration = duration && isFinite(duration) && duration > 0 ? duration : 100;
  const progressPercent = (localProgress / safeDuration) * 100;

  return (
    <div className="px-6 my-6 z-0" dir="ltr">
      <div className="relative h-11 flex items-center touch-none group">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#2b1a10]/12 overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#deab65] to-[#b88a4f] rounded-full transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Thumb */}
        <div 
          className={`absolute w-4 h-4 bg-[#b88a4f] rounded-full shadow-md border-2 border-white transition-transform ${isDragging ? "scale-125" : "group-hover:scale-110"}`}
          style={{ left: `calc(${progressPercent}% - 8px)` }}
        />
        {/* Native input overlay for 60fps dragging */}
        <input 
          type="range" 
          min={0} 
          max={safeDuration} 
          step={0.1}
          value={localProgress}
          onChange={handleSeekChange}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
          onMouseUp={handleSeekCommit}
          onTouchEnd={handleSeekCommit}
          onPointerCancel={handleSeekCommit}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none"
        />
      </div>
      <div className="flex justify-between mt-2 font-numbers text-[13px] text-[#7f6a55] font-bold px-1">
        <span>{formatTime(localProgress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
