import { Sun, MoonStar, Sunrise, Sunset, SunDim } from "lucide-react";
import { PrayerKey } from "@/types/app.types";

export function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function AdhkarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a9 9 0 1 0 9 9A6.5 6.5 0 0 1 12 3z" />
      <path d="M19 2l.7 1.3L21 4l-1.3.7L19 6l-.7-1.3L17 4l1.3-.7z" />
    </svg>
  );
}

export function PrayerIcon({
  prayerKey,
  active,
}: {
  prayerKey: PrayerKey;
  active: boolean;
}) {
  const props = {
    className: "h-[20px] w-[20px] text-current drop-shadow-sm",
    fill: "currentColor",
    strokeWidth: 1.5,
  };
  if (prayerKey === "fajr") return <Sunrise {...props} />;
  if (prayerKey === "sunrise") return <Sunrise {...props} />;
  if (prayerKey === "dhuhr") return <Sun {...props} />;
  if (prayerKey === "asr") return <SunDim {...props} />;
  if (prayerKey === "maghrib") return <Sunset {...props} />;
  if (prayerKey === "isha") return <MoonStar {...props} />;
  return <Sun {...props} />;
}

export function ClockTiny() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.8" />
    </svg>
  );
}

export function PlayTiny() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M8 6.8a1 1 0 0 1 1.5-.9l8 5.2a1 1 0 0 1 0 1.8l-8 5.2A1 1 0 0 1 8 17.2Z" />
    </svg>
  );
}

export function LocationPin() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px] text-white/90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function ArrowLeftIcon({
  className = "h-[16px] w-[16px]",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 5 5 12 12 19" />
    </svg>
  );
}
