import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import QcfVerse from "./QcfVerse";
import { APP_VERSES } from "@/constants/appVerses";

interface SplashScreenProps {
  onComplete: () => void;
}

const MIN_SPLASH_MS = 900;
const MAX_SPLASH_MS = 1700;

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isVerseReady, setIsVerseReady] = useState(false);
  const startedAtRef = useRef(typeof performance === "undefined" ? Date.now() : performance.now());
  const prefersReducedMotion = useReducedMotion();

  const finishWhenStable = useCallback(() => {
    const now = typeof performance === "undefined" ? Date.now() : performance.now();
    const elapsed = now - startedAtRef.current;
    const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = window.setTimeout(() => setIsVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, []);

  const handleVerseReady = useCallback(() => setIsVerseReady(true), []);

  useEffect(() => {
    if (!isVerseReady) return;
    return finishWhenStable();
  }, [finishWhenStable, isVerseReady]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(false), MAX_SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const fadeDuration = prefersReducedMotion ? 0.01 : 0.32;
  const revealDuration = prefersReducedMotion ? 0.01 : 0.42;

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
          className="fixed inset-0 z-50 isolate flex min-h-[100dvh] w-full cursor-pointer select-none items-center justify-center overflow-hidden bg-[#ece7de] px-[clamp(20px,5vw,64px)] text-[#2b1a10]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeDuration, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.72),transparent_34%),linear-gradient(180deg,#f7f2ea_0%,#ece7de_68%,#e7dfd3_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/80" />

          <motion.div
            className="relative z-10 flex w-full max-w-[430px] flex-col items-center"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: revealDuration, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex flex-col items-center text-center">
              <span className="text-[clamp(0.58rem,1.7vw,0.72rem)] font-medium tracking-[0.34em] text-[#7f6a55]/65">SAKINAH</span>
              <h1 className="mt-2 font-display text-[clamp(2rem,8vw,3.1rem)] font-black leading-none tracking-tight text-[#2b1a10]">
                سَكِينَة
              </h1>
              <p className="mt-3 text-[clamp(0.74rem,2vw,0.9rem)] font-medium text-[#7f6a55]">
                طمأنينة في كل يوم
              </p>
            </header>

            <motion.div
              className="mt-[clamp(28px,6vh,52px)] flex items-center gap-2 text-[#b88a4f]/70"
              initial={{ opacity: 0, scaleX: 0.7 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: revealDuration, delay: prefersReducedMotion ? 0 : 0.06, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden="true"
            >
              <span className="h-px w-[clamp(42px,12vw,82px)] bg-gradient-to-l from-transparent to-[#b88a4f]/65" />
              <span className="h-1.5 w-1.5 rotate-45 border border-[#b88a4f]/70" />
              <span className="h-px w-[clamp(42px,12vw,82px)] bg-gradient-to-r from-transparent to-[#b88a4f]/65" />
            </motion.div>

            <motion.section
              className="cut-crystal-satin relative mt-[clamp(20px,4vh,34px)] flex min-h-[clamp(220px,30vh,286px)] w-full flex-col items-center justify-center overflow-hidden rounded-[32px] px-[clamp(20px,6vw,42px)] py-[clamp(24px,5vh,38px)] text-center"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: revealDuration, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/95" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f7f2ea]/45 to-transparent" />

              <div className="relative z-10 flex min-h-[clamp(126px,18vh,170px)] w-full items-center justify-center">
                <motion.div
                  className="absolute inset-x-0 flex flex-col items-center"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 7 }}
                  animate={{ opacity: isVerseReady ? 1 : 0, y: isVerseReady ? 0 : 7 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.38, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden={!isVerseReady}
                >
                  <div
                    id="splash-verse"
                    className="max-w-[min(100%,38rem)] text-[clamp(1.08rem,3.7vw,2.08rem)] leading-[2.15] text-[#2b1a10]"
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
                    className="mt-4 rounded-full border border-[#2b1a10]/10 bg-[#f7f2ea]/75 px-3 py-1 text-[clamp(0.62rem,1.7vw,0.78rem)] font-bold text-[#7f6a55]"
                  >
                    {APP_VERSES.splash.source}
                  </span>
                </motion.div>

                <AnimatePresence initial={false}>
                  {!isVerseReady && (
                    <motion.div
                      key="verse-wait"
                      className="flex items-center gap-1.5"
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b88a4f]/35" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b88a4f]/70" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b88a4f]/35" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            <footer className="mt-[clamp(18px,4vh,30px)] flex items-center gap-3 text-[clamp(0.62rem,1.7vw,0.76rem)] font-medium text-[#7f6a55]/65">
              <span>القرآن</span>
              <span className="h-1 w-1 rounded-full bg-[#b88a4f]/55" />
              <span>الأذكار</span>
              <span className="h-1 w-1 rounded-full bg-[#b88a4f]/55" />
              <span>مواقيت الصلاة</span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
