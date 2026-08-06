import React, { useEffect, useRef, useState } from 'react';

interface SeamlessBgVideoProps {
  src: string;
}

/**
 * يشغّل نفس مصدر الفيديو في طبقتين متراكبتين، ويبدّل بينهما
 * (crossfade) قبل نقطة نهاية الفيديو الفعلية بجزء من الثانية،
 * بحيث لا تُرى لحظة إعادة التشغيل (loop) إطلاقًا وبدون توقف.
 */
export function SeamlessBgVideo({ src }: SeamlessBgVideoProps) {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
  const switchingRef = useRef(false);

  // هامش الأمان قبل نهاية الفيديو الذي يبدأ عنده التبديل (بالثواني)
  const CROSSFADE_LEAD = 0.5;

  // مرجع دائم القراءة لآخر قيمة activeLayer داخل الـ event listener
  const activeLayerRef = useRef(activeLayer);
  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    switchingRef.current = false;
    setActiveLayer('A');

    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a || !b) return;

    a.currentTime = 0;
    b.currentTime = 0;
    a.play().catch(() => {});

    const doSwitch = () => {
      if (switchingRef.current) return;
      switchingRef.current = true;

      const currentActive = activeLayerRef.current === 'A' ? a : b;
      const currentStandby = activeLayerRef.current === 'A' ? b : a;

      currentStandby.currentTime = 0;
      currentStandby.play().catch(() => {});
      setActiveLayer((prev) => (prev === 'A' ? 'B' : 'A'));

      setTimeout(() => {
        try {
          currentActive.pause();
        } catch {}
        switchingRef.current = false;
      }, 350);
    };

    const handleTimeUpdate = () => {
      const active = activeLayerRef.current === 'A' ? a : b;
      if (!active.duration || switchingRef.current) return;

      const remaining = active.duration - active.currentTime;
      if (remaining <= CROSSFADE_LEAD) {
        doSwitch();
      }
    };

    const handleEnded = () => {
      doSwitch();
    };

    a.addEventListener('timeupdate', handleTimeUpdate);
    b.addEventListener('timeupdate', handleTimeUpdate);
    a.addEventListener('ended', handleEnded);
    b.addEventListener('ended', handleEnded);

    return () => {
      a.removeEventListener('timeupdate', handleTimeUpdate);
      b.removeEventListener('timeupdate', handleTimeUpdate);
      a.removeEventListener('ended', handleEnded);
      b.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  return (
    <>
      <video
        ref={videoARef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 -z-10 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ease-linear"
        style={{ opacity: activeLayer === 'A' ? 1 : 0 }}
      />
      <video
        ref={videoBRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 -z-10 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ease-linear"
        style={{ opacity: activeLayer === 'B' ? 1 : 0 }}
      />
    </>
  );
}
