import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import QcfVerse from "./QcfVerse";
import { APP_VERSES } from "@/constants/appVerses";

interface SplashScreenProps {
  onComplete: () => void;
}

const MIN_SPLASH_MS = 920;
const MAX_SPLASH_MS = 1750;

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

  const handleVerseReady = useCallback(() => {
    setIsVerseReady(true);
  }, []);

  useEffect(() => {
    if (!isVerseReady) return;
    return finishWhenStable();
  }, [finishWhenStable, isVerseReady]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(false), MAX_SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const enterDuration = prefersReducedMotion ? 0.01 : 0.42;
  const exitDuration = prefersReducedMotion ? 0.01 : 0.28;

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
          className="fixed inset-0 z-50 isolate flex min-h-[100dvh] w-full cursor-pointer select-none flex-col overflow-hidden bg-[#180d07] text-[#f7efe3]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: exitDuration, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(222,171,101,0.18),transparent_25%),linear-gradient(180deg,#180d07_0%,#2a170f_48%,#8d6340_74%,#ece7de_100%)]" />
          <div className="pointer-events-none absolute inset-x-[-25%] bottom-[-16vh] h-[44vh] rounded-[50%] bg-[#f4ecd8]/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh] bg-[linear-gradient(180deg,transparent,rgba(236,231,222,0.7))]" />

          <motion.div
            className="relative z-10 flex min-h-[100dvh] w-full flex-col px-[clamp(22px,6vw,72px)] py-[clamp(26px,5vh,54px)]"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: enterDuration, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-start justify-between">
              <div className="text-right leading-none">
                <p className="text-[clamp(0.55rem,1.6vw,0.72rem)] tracking-[0.34em] text-white/60">SAKINAH</p>
                <p className="mt-1 font-display text-[clamp(1.35rem,4.8vw,2rem)] font-black text-white">سَكِينَة</p>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[clamp(0.62rem,1.7vw,0.76rem)] font-bold text-white/55">
                <span className="h-px w-7 bg-[#deab65]/70" />
                <span>طمأنينة في كل يوم</span>
              </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center text-center">
              <motion.div
                className="mb-[clamp(22px,5vh,44px)] flex items-center gap-3 text-[#deab65]"
                initial={{ opacity: 0, scaleX: 0.65 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: enterDuration, delay: prefersReducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="h-px w-[clamp(34px,10vw,78px)] bg-gradient-to-l from-transparent to-[#deab65]" />
                <span className="h-1.5 w-1.5 rotate-45 border border-[#deab65]" />
                <span className="h-px w-[clamp(34px,10vw,78px)] bg-gradient-to-r from-transparent to-[#deab65]" />
              </motion.div>

              <div className="relative flex min-h-[clamp(150px,24vh,232px)] w-full max-w-[42rem] items-center justify-center">
                <motion.div
                  className="absolute inset-x-0 flex flex-col items-center"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  animate={{ opacity: isVerseReady ? 1 : 0, y: isVerseReady ? 0 : 8 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden={!isVerseReady}
                >
                  <div
                    id="splash-verse"
                    className="max-w-[min(100%,39rem)] text-[clamp(1.1rem,3.8vw,2.15rem)] leading-[2.2] text-[#f4ecd8] drop-shadow-[0_3px_18px_rgba(24,13,7,0.35)]"
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
                    className="mt-5 rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[clamp(0.65rem,1.8vw,0.8rem)] font-bold text-white/70 backdrop-blur-sm"
                  >
                    {APP_VERSES.splash.source}
                  </span>
                </motion.div>

                <AnimatePresence initial={false}>
                  {!isVerseReady && (
                    <motion.div
                      key="verse-wait"
                      className="flex items-center gap-2 text-white/45"
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="h-1 w-1 rounded-full bg-[#deab65]/60" />
                      <span className="h-1 w-1 rounded-full bg-[#deab65]" />
                      <span className="h-1 w-1 rounded-full bg-[#deab65]/60" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </main>

            <footer className="flex items-end justify-between border-t border-white/15 pt-4 text-[clamp(0.58rem,1.6vw,0.72rem)] font-bold text-white/50">
              <span>القرآن • الأذكار • مواقيت الصلاة</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#deab65]" />
                يومك بطمأنينة
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
