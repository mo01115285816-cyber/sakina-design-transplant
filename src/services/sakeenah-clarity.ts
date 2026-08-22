import { Capacitor } from "@capacitor/core";

const CLARITY_SCRIPT_ID = "sakeenah-clarity-script";
// Clarity project IDs are public identifiers by design. Keep web and Android
// projects separate because Clarity treats them as independent projects.
const webProjectId = (import.meta.env.VITE_CLARITY_WEB_PROJECT_ID ?? "y6d9t1c2z0").trim();
const androidProjectId = (import.meta.env.VITE_CLARITY_ANDROID_PROJECT_ID ?? "xxkk4ujgy6").trim();

interface ClarityPluginApi {
  initialize: (
    projectId: string,
    success: (message?: string) => void,
    failure: (message?: string) => void,
    config?: { isIonic?: boolean; logLevel?: number },
  ) => void;
  pause: (success: (message?: string) => void, failure: (message?: string) => void) => void;
  resume: (success: (message?: string) => void, failure: (message?: string) => void) => void;
}

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
    ClarityPlugin?: ClarityPluginApi;
  }
}

let nativeInitialized = false;
let webLoadPromise: Promise<void> | null = null;
let lastNativeBlocked: boolean | null = null;
let desiredBlocked = false;

function logClarityFailure(operation: string, error?: unknown) {
  if (import.meta.env.DEV) {
    console.warn(`[Sakeenah Clarity] ${operation} failed`, error);
  }
}

function markPolicy(blocked: boolean) {
  document.documentElement.dataset.sakeenahClarity = blocked ? "blocked" : "active";
}

function loadWebClarity(): Promise<void> {
  if (!webProjectId || typeof window === "undefined") return Promise.resolve();
  if (window.clarity && document.getElementById(CLARITY_SCRIPT_ID)) return Promise.resolve();
  if (webLoadPromise) return webLoadPromise;

  window.clarity = window.clarity || ((...args: unknown[]) => {
    (window.clarity!.q = window.clarity!.q || []).push(args);
  });

  webLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = CLARITY_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(webProjectId)}`;
    script.onload = () => resolve();
    script.onerror = () => {
      webLoadPromise = null;
      reject(new Error("Microsoft Clarity web script failed to load"));
    };
    document.head.appendChild(script);
  });

  return webLoadPromise;
}

function waitForNativePlugin(timeoutMs = 2500): Promise<ClarityPluginApi | null> {
  if (window.ClarityPlugin) return Promise.resolve(window.ClarityPlugin);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (plugin: ClarityPluginApi | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("deviceready", onDeviceReady);
      window.clearTimeout(timeoutId);
      resolve(plugin);
    };
    const onDeviceReady = () => finish(window.ClarityPlugin ?? null);
    const timeoutId = window.setTimeout(() => finish(window.ClarityPlugin ?? null), timeoutMs);
    document.addEventListener("deviceready", onDeviceReady, { once: true });
  });
}

function callNative(
  operation: "initialize" | "pause" | "resume",
  plugin: ClarityPluginApi,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const success = () => resolve();
    const failure = (message?: string) => reject(new Error(message || `${operation} failed`));

    if (operation === "initialize") {
      plugin.initialize(androidProjectId, success, failure, { isIonic: true });
    } else {
      plugin[operation](success, failure);
    }
  });
}

/**
 * The single policy gate for all Clarity capture.
 * `blocked=true` is used for Sakeenah AI and all of its related surfaces.
 */
export async function syncSakeenahClarity(blocked: boolean): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  desiredBlocked = blocked;
  markPolicy(blocked);
  if (!webProjectId && !androidProjectId) return;

  if (Capacitor.isNativePlatform()) {
    const plugin = await waitForNativePlugin();
    if (!plugin) {
      logClarityFailure("native plugin unavailable");
      return;
    }

    try {
      if (!nativeInitialized) {
        await callNative("initialize", plugin);
        nativeInitialized = true;
        lastNativeBlocked = false;
      }

      const effectiveBlocked = desiredBlocked;
      if (lastNativeBlocked === effectiveBlocked) return;
      await callNative(effectiveBlocked ? "pause" : "resume", plugin);
      lastNativeBlocked = effectiveBlocked;
    } catch (error) {
      logClarityFailure(blocked ? "pause" : "resume", error);
    }
    return;
  }

  if (blocked) {
    // The web API's consent=false state prevents Clarity cookies and future
    // consent-based collection while the AI surface is mounted.
    window.clarity?.("consent", false);
    return;
  }

  try {
    await loadWebClarity();
    if (desiredBlocked) {
      window.clarity?.("consent", false);
      return;
    }
    window.clarity?.("consent", true);
  } catch (error) {
    logClarityFailure("web initialization", error);
  }
}

export function isSakeenahClarityConfigured(): boolean {
  return Boolean(webProjectId || androidProjectId);
}
