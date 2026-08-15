import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import QcfVerse from "./QcfVerse";
import { APP_VERSES } from "@/constants/appVerses";
import { publicAssetUrl } from "@/utils/publicAssetUrl";

interface SplashScreenProps {
  onComplete: () => void;
}

const SPLASH_DURATION_MS = 2400;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isVerseReady, setIsVerseReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleVerseReady = useCallback(() => {
    setIsVerseReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, SPLASH_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const transitionDuration = prefersReducedMotion ? 0.01 : 0.65;
  const revealDuration = prefersReducedMotion ? 0.01 : 0.8;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          id="splash-screen-container"
          role="button"
          tabIndex={0}
          aria-label="تخطي شاشة الترحيب"
          onClick={() => setIsVisible(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") setIsVisible(false);
          }}
          className="fixed inset-0 z-50 isolate flex min-h-[100dvh] w-full cursor-pointer select-none items-center justify-center overflow-hidden bg-[#ece7de] px-[clamp(20px,5vw,72px)] text-[#2b1a10]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: transitionDuration, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(184,138,79,0.13),transparent_31%),linear-gradient(180deg,#f4f0e9_0%,#ece7de_58%,#e3dbcf_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22vh] bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.34))]" />

          <motion.div
            className="relative z-10 flex w-full max-w-[42rem] flex-col items-center text-center"
            initial={{ y: prefersReducedMotion ? 0 : 12, scale: prefersReducedMotion ? 1 : 0.985 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: revealDuration, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.img
              src={publicAssetUrl("images/quran-circle.png")}
              alt=""
              aria-hidden="true"
              className="h-[clamp(76px,18vw,132px)] w-[clamp(76px,18vw,132px)] object-contain drop-shadow-[0_18px_34px_rgba(113,81,44,0.16)]"
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: revealDuration, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.div
              className="mt-[clamp(18px,4vh,32px)] h-px w-[clamp(56px,12vw,96px)] bg-[#b88a4f]/55"
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: revealDuration, delay: prefersReducedMotion ? 0 : 0.12, ease: [0.16, 1, 0.3, 1] }}
            />

            <div className="relative mt-[clamp(24px,5vh,48px)] flex min-h-[clamp(142px,22vh,210px)] w-full flex-col items-center justify-center">
              <motion.div
                className="absolute inset-x-0 flex w-full flex-col items-center"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                animate={{ opacity: isVerseReady ? 1 : 0, y: isVerseReady ? 0 : 8 }}
                transition={{ duration: revealDuration, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden={!isVerseReady}
              >
                <div
                  id="splash-verse"
                  className="max-w-[min(100%,38rem)] text-[clamp(1.18rem,3.6vw,2.35rem)] font-normal leading-[2.15] text-[#2b1a10]"
                  style={{ direction: "rtl" }}
                >
                  <QcfVerse
                    verseKey={APP_VERSES.splash.verseKey}
                    pageNumber={APP_VERSES.splash.pageNumber}
                    wordStart={APP_VERSES.splash.wordStart}
                    wordEnd={APP_VERSES.splash.wordEnd}
                    hideFallback
                    onReady={handleVerseReady}
                  />
                </div>
                <span
                  id="splash-verse-source"
                  className="mt-5 text-[clamp(0.72rem,1.8vw,0.88rem)] font-medium tracking-[0.08em] text-[#9a6f3e]/85"
                >
                  {APP_VERSES.splash.source}
                </span>
              </motion.div>

              <AnimatePresence initial={false}>
                {!isVerseReady && (
                  <motion.div
                    key="verse-loading"
                    aria-hidden="true"
                    className="flex h-12 items-center justify-center gap-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b88a4f]/35" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b88a4f]/55" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b88a4f]/35" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="mt-[clamp(12px,3vh,26px)] text-[clamp(0.78rem,2vw,0.95rem)] font-semibold tracking-[0.34em] text-[#8b6842]"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: revealDuration, delay: prefersReducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              سَكِينَة
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
