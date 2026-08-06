import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Radio,
  Pause,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Volume2,
  VolumeX,
  ChevronDown,
  RadioTower,
  RadioReceiver,
} from "lucide-react";
import { RadioStation } from "@/types/radio";
import { radioStations } from "@/data/radioStations";

interface Props {
  // Global Audio Ref & state controls provided by parent (QuranTabScreen)
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  currentPlayingRadio: RadioStation | null;
  isPlayingRadio: boolean;
  onPlayRadio: (radio: RadioStation) => void;
  onPauseRadio: () => void;
}

export default function QuranLiveBroadcast({
  audioRef,
  currentPlayingRadio,
  isPlayingRadio,
  onPlayRadio,
  onPauseRadio,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isVolumeExpanded, setIsVolumeExpanded] = useState(false);

  const activeStation = radioStations[currentIndex];

  // Sync volume with global audio if this radio is active
  useEffect(() => {
    if (audioRef.current && currentPlayingRadio?.id === activeStation.id) {
      audioRef.current.volume = volume;
    }
  }, [volume, currentPlayingRadio, activeStation, audioRef]);

  // Handle stream loading states
  useEffect(() => {
    if (!audioRef.current) return;

    const handleWaiting = () => {
      if (currentPlayingRadio?.id === activeStation.id) {
        setIsLoading(true);
      }
    };
    const handlePlaying = () => {
      if (currentPlayingRadio?.id === activeStation.id) {
        setIsLoading(false);
      }
    };
    const handleCanPlay = () => {
      if (currentPlayingRadio?.id === activeStation.id) {
        setIsLoading(false);
      }
    };
    const handleLoadedData = () => {
      if (currentPlayingRadio?.id === activeStation.id) {
        setIsLoading(false);
      }
    };

    const audio = audioRef.current;
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", handleLoadedData);

    return () => {
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [currentPlayingRadio, activeStation, audioRef]);

  // Update loading state when stream play/pause changes
  useEffect(() => {
    if (currentPlayingRadio?.id === activeStation.id && isPlayingRadio) {
      const audio = audioRef.current;
      if (audio && !audio.paused && audio.readyState >= 3) {
        setIsLoading(false);
      } else {
        setIsLoading(true); // set loading until buffer is ready
      }
    } else {
      setIsLoading(false);
    }
  }, [currentPlayingRadio, activeStation, isPlayingRadio, audioRef]);

  const handleNextStation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % radioStations.length);
  };

  const handlePrevStation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + radioStations.length) % radioStations.length,
    );
  };

  const togglePlayback = () => {
    const isActive = currentPlayingRadio?.id === activeStation.id;
    if (isActive && isPlayingRadio) {
      onPauseRadio();
    } else {
      onPlayRadio(activeStation);
    }
  };

  const isActiveAndPlaying =
    currentPlayingRadio?.id === activeStation.id && isPlayingRadio;

  return (
    <div id="live-broadcast-section" className="w-full mb-6 relative" dir="rtl">
      {/* Title */}
      <h2 className="text-[20px] font-bold text-[#2b1a10] mb-3.5 flex items-center gap-2 px-1">
        <span>البث الصوتي</span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#80a390]"></span>
      </h2>

      {/* Main Beautiful Card */}
      <div className="relative z-20">
        <div
          className={`w-full overflow-hidden rounded-[28px] relative transition-all duration-300 cut-crystal-panel !border-white/15 !border-t-white/50 !shadow-[0_12px_32px_rgba(0,0,0,0.12)] ${
            activeStation.logoType === "sba"
              ? "!bg-gradient-to-br !from-[#80a390]/80 !to-[#5a7d6a]/85 text-white"
              : "!bg-gradient-to-br !from-[#5f748c]/80 !to-[#45566b]/85 text-white"
          }`}
        >
          {/* Decorative subtle Islamic geometric overlay */}
          <div className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Swipe or navigation chevrons for stations */}
          <div className="absolute top-1/2 -translate-y-1/2 left-1 z-10">
            <button
              onClick={handlePrevStation}
              className="w-7 h-7 cut-crystal-capsule !bg-white/10 hover:!bg-white/20 active:scale-90 flex items-center justify-center transition-all text-[#2b1a10] !border-white/20"
              title="الإذاعة السابقة"
            >
              <ChevronRight size={16} className="translate-x-[0.5px]" />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-1 z-10">
            <button
              onClick={handleNextStation}
              className="w-7 h-7 cut-crystal-capsule !bg-white/10 hover:!bg-white/20 active:scale-90 flex items-center justify-center transition-all text-[#2b1a10] !border-white/20"
              title="الإذاعة التالية"
            >
              <ChevronLeft size={16} className="translate-x-[-0.5px]" />
            </button>
          </div>

          {/* Content Container */}
          <div className="pr-10 pl-[84px] py-5 flex items-center justify-between gap-4">
            {/* Texts & Controls on the Right (RTL means first element is rendered on the right) */}
            <div className="flex-1 flex flex-col text-right justify-center">
              {/* AnimatePresence for smooth text transitions on swap */}
              <div className="h-[48px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="text-[15px] font-bold text-white leading-tight mb-1 font-sans">
                      {activeStation.name}
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium leading-none font-sans">
                      {activeStation.subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action buttons section */}
              <div className="mt-3 flex items-center gap-2">
                {/* Play/Pause pill button */}
                <button
                  onClick={togglePlayback}
                  disabled={isActiveAndPlaying && isLoading}
                  className={`h-8 px-4 rounded-full flex items-center justify-center gap-1.5 text-[12px] whitespace-nowrap font-bold tracking-wide transition-all active:scale-[0.96] shadow-sm border shrink-0 ${
                    isActiveAndPlaying
                      ? "bg-[#ef4444] hover:bg-[#dc2626] text-white border-red-400/20"
                      : activeStation.logoType === "sba"
                        ? "bg-[#064e3b] hover:bg-[#043e2f] text-white border-[#064e3b]"
                        : "bg-[#115e59] hover:bg-[#0f4e4a] text-white border-[#115e59]"
                  }`}
                >
                  {isLoading && isActiveAndPlaying ? (
                    <>
                      <Loader2
                        size={13}
                        className="animate-spin text-white shrink-0"
                      />
                      <span>جاري الاتصال...</span>
                    </>
                  ) : isActiveAndPlaying ? (
                    <>
                      <Pause
                        size={12}
                        fill="currentColor"
                        className="shrink-0"
                      />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Radio size={13} className="text-white shrink-0" />
                      <span>استماع مباشر</span>
                    </>
                  )}

                  {/* Animated active beacon dot if playing */}
                  {isActiveAndPlaying && !isLoading && (
                    <span className="relative flex h-2 w-2 mr-0.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  )}

                  {/* Fixed red live dot when inactive but standby */}
                  {!isActiveAndPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-0.5 shrink-0"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Logo on the left (RTL means second element is rendered on the left) */}
            <div className="shrink-0 relative group">
              {activeStation.logoType === "sba" ? (
                /* Saudi SBA Logo box: Gold style */
                <div className="w-20 h-20 shrink-0 rounded-[14px] cut-crystal-panel !bg-gradient-to-br !from-[#deab65]/85 !to-[#b88a4f]/85 text-white flex flex-col items-center justify-center !border-white/20 relative overflow-hidden">
                  {/* Inside pattern and Dome icon */}
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white/10 rounded-full blur-md" />
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mb-1">
                    <RadioTower size={14} className="opacity-90" />
                  </div>
                  <span className="text-[10px] font-bold tracking-tight leading-none font-sans whitespace-nowrap mt-0.5">
                    القرآن الكريم
                  </span>
                </div>
              ) : (
                /* Cairo Egypt Logo box: Emerald/Gold style */
                <div className="w-20 h-20 shrink-0 rounded-[14px] cut-crystal-panel !bg-gradient-to-br !from-[#115e59]/85 !to-[#0f766e]/85 text-white flex flex-col items-center justify-center !border-white/20 relative overflow-hidden">
                  <div className="absolute -top-1 -left-1 w-10 h-10 bg-white/10 rounded-full blur-md" />
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mb-1">
                    <RadioReceiver size={14} className="opacity-90" />
                  </div>
                  <span className="text-[10px] font-bold tracking-tight leading-none font-sans whitespace-nowrap mt-0.5">
                    إذاعة القاهرة
                  </span>
                </div>
              )}

              {/* Glowing wave bars overlay if playing */}
              {isActiveAndPlaying && !isLoading && (
                <div className="absolute -top-1 -right-1 flex gap-0.5 bg-[#ef4444] px-1.5 py-0.5 rounded-full border border-white/20 shadow-sm items-center scale-[0.85] origin-top-right">
                  <div className="w-1 h-2 bg-white animate-[bounce_0.8s_infinite_100ms] rounded-full" />
                  <div className="w-1 h-3 bg-white animate-[bounce_0.8s_infinite_300ms] rounded-full" />
                  <div className="w-1 h-1.5 bg-white animate-[bounce_0.8s_infinite_200ms] rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Floating Volume Handle inside the card at bottom center */}
          {isActiveAndPlaying && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={() => setIsVolumeExpanded(!isVolumeExpanded)}
                className="w-10 h-4 cut-crystal-capsule !bg-white/10 hover:!bg-white/20 active:scale-95 transition-all flex items-center justify-center !border-white/20"
                title="التحكم بالصوت"
              >
                <motion.div
                  animate={{ rotate: isVolumeExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <ChevronDown size={12} className="text-white opacity-80" />
                </motion.div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Volume Slider Drawer */}
      <AnimatePresence>
        {isVolumeExpanded && isActiveAndPlaying && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-12 right-12 mt-1.5 z-10"
          >
            <div
              className="cut-crystal-panel rounded-full h-[32px] px-3.5 flex items-center gap-3 shadow-sm text-text-primary border border-separator/30"
              dir="ltr"
            >
              <button
                onClick={() => setVolume(0)}
                className="text-[#8b5a2b] hover:text-[#8b5a2b]/80 transition-colors active:scale-90 shrink-0"
              >
                <VolumeX size={13} />
              </button>

              <div className="flex-1 relative flex items-center h-4 group">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 appearance-none bg-[#8b5a2b]/20 rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#8b5a2b]/30 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md transition-all [&::-webkit-slider-thumb]:hover:scale-110 z-10"
                />
                {/* Custom fill track overlay */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#8b5a2b] rounded-full pointer-events-none transition-all duration-75 shadow-sm"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>

              <button
                onClick={() => setVolume(1)}
                className="text-[#8b5a2b] hover:text-[#8b5a2b]/80 transition-colors active:scale-90 shrink-0"
              >
                <Volume2 size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
