import { Capacitor, registerPlugin } from "@capacitor/core";
import type { RadioStation } from "@/types/radio";

export type RadioCaptureState = "idle" | "recording" | "saving";

export interface RadioCaptureResult {
  fileName: string;
  mimeType: string;
  stationId: string;
  stationName: string;
  durationMs?: number;
  uri?: string;
  localPath?: string;
  reason?: string;
}

interface NativeRadioCapturePlugin {
  start(options: {
    streamUrl: string;
    stationId: string;
    stationName: string;
  }): Promise<{ success: boolean }>;
  stop(options: { reason?: string }): Promise<RadioCaptureResult | { success: false; message?: string }>;
}

const nativeRadioCapture = registerPlugin<NativeRadioCapturePlugin>("RadioCapture");

type WebAudioElement = HTMLAudioElement & {
  captureStream?: () => MediaStream;
};

let state: RadioCaptureState = "idle";
let activeStation: RadioStation | null = null;
let activeStartedAt = 0;
let webRecorder: MediaRecorder | null = null;
let webCaptureAudio: HTMLAudioElement | null = null;
let webChunks: Blob[] = [];
let webMimeType = "audio/webm";
let webStopPromise: Promise<RadioCaptureResult | null> | null = null;
const listeners = new Set<(nextState: RadioCaptureState) => void>();

function setState(nextState: RadioCaptureState) {
  state = nextState;
  listeners.forEach((listener) => listener(nextState));
}

function makeFileName(stationName: string, extension: string) {
  const safeStationName = stationName
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const stamp = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(", ", " ")
    .replace(/:/g, "-");
  return `Sakina - ${safeStationName} - ${stamp}.${extension}`;
}

function chooseWebMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function isNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export const RadioCaptureService = {
  getState() {
    return state;
  },

  getActiveStationId() {
    return activeStation?.id ?? null;
  },

  isNative,

  isWebSupported() {
    return !isNative() && typeof Audio !== "undefined" && Boolean(
      "captureStream" in HTMLMediaElement.prototype && chooseWebMimeType(),
    );
  },

  subscribe(listener: (nextState: RadioCaptureState) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async start(station: RadioStation, _audio: HTMLAudioElement | null) {
    if (state !== "idle") {
      throw new Error("يوجد تسجيل جارٍ بالفعل.");
    }

    if (isNative()) {
      await nativeRadioCapture.start({
        streamUrl: station.url,
        stationId: station.id,
        stationName: station.name,
      });
      activeStation = station;
      activeStartedAt = Date.now();
      setState("recording");
      return;
    }

    const mimeType = chooseWebMimeType();
    if (!this.isWebSupported() || !mimeType) {
      throw new Error("تسجيل البث غير مدعوم في هذا المتصفح.");
    }

    const captureAudio = new Audio(station.url);
    captureAudio.crossOrigin = "anonymous";
    captureAudio.preload = "auto";
    captureAudio.muted = true;
    captureAudio.setAttribute("playsinline", "");
    webCaptureAudio = captureAudio;

    let stream: MediaStream;
    try {
      await captureAudio.play();
      const captureStream = (captureAudio as WebAudioElement).captureStream;
      if (!captureStream) throw new Error("المتصفح لا يسمح بالتقاط البث.");
      stream = captureStream.call(captureAudio);
    } catch {
      webCaptureAudio = null;
      captureAudio.src = "";
      throw new Error("تعذر التقاط مصدر البث من المتصفح؛ قد يمنع المصدر التسجيل عبر CORS.");
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    webChunks = [];
    webMimeType = mimeType;
    webRecorder = recorder;
    activeStation = station;
    activeStartedAt = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) webChunks.push(event.data);
    };
    recorder.onerror = () => {
      recorder.stream.getTracks().forEach((track) => track.stop());
      webCaptureAudio?.pause();
      if (webCaptureAudio) webCaptureAudio.src = "";
      webCaptureAudio = null;
      webRecorder = null;
      webChunks = [];
      activeStation = null;
      activeStartedAt = 0;
      setState("idle");
    };
    recorder.start(1000);
    setState("recording");
  },

  async stop(reason = "manual") {
    if (state === "idle" || !activeStation) return null;
    if (state === "saving" && webStopPromise) return webStopPromise;

    const station = activeStation;
    const startedAt = activeStartedAt;

    if (isNative()) {
      setState("saving");
      try {
        const result = await nativeRadioCapture.stop({ reason });
        const normalized = "success" in result && result.success === false ? null : (result as RadioCaptureResult);
        return normalized;
      } finally {
        activeStation = null;
        activeStartedAt = 0;
        setState("idle");
      }
    }

    const recorder = webRecorder;
    if (!recorder) {
      activeStation = null;
      setState("idle");
      return null;
    }

    setState("saving");
    webStopPromise = new Promise<RadioCaptureResult | null>((resolve) => {
      recorder.onstop = () => {
        const extension = webMimeType.includes("ogg") ? "ogg" : "webm";
        const fileName = makeFileName(station.name, extension);
        const blob = new Blob(webChunks, { type: webMimeType });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
        recorder.stream.getTracks().forEach((track) => track.stop());
        webCaptureAudio?.pause();
        if (webCaptureAudio) webCaptureAudio.src = "";
        webCaptureAudio = null;

        resolve({
          fileName,
          mimeType: webMimeType,
          stationId: station.id,
          stationName: station.name,
          durationMs: Math.max(0, Date.now() - startedAt),
          reason,
        });
      };
      recorder.stop();
    }).finally(() => {
      webRecorder = null;
      webChunks = [];
      webStopPromise = null;
      activeStation = null;
      activeStartedAt = 0;
      setState("idle");
    });

    return webStopPromise;
  },
};
