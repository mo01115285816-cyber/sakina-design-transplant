import { lazy, StrictMode, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import SplashScreen from "./components/SplashScreen";
import "./index.css";

// Start fetching the application bundle immediately, but do not make its
// synchronous module evaluation part of the first paint.
const appModulePromise = import("./App");
const App = lazy(() => appModulePromise);

function Boot() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    void appModulePromise.then(() => {
      if (mounted) setIsAppReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div dir="rtl" className="min-h-[100dvh] w-full bg-[#ece7de] text-[#2b1a10]">
      {!isSplashComplete && (
        <SplashScreen canComplete={isAppReady} onComplete={() => setIsSplashComplete(true)} />
      )}

      {isSplashComplete && isAppReady && (
        <Suspense fallback={<div className="min-h-[100dvh] w-full bg-[#ece7de]" />}>
          <App />
        </Suspense>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);
