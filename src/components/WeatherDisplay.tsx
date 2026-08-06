import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { WeatherData } from "@/types/app.types";

export function WeatherDisplay({ weather }: { weather: WeatherData | null }) {
  if (!weather) return <div className="h-[22px]" />;

  const { temp, conditionCode, isDay } = weather;

  let Icon = Sun;
  let conditionText = "مشمس";

  if (conditionCode === 0) {
    Icon = isDay ? Sun : Moon;
    conditionText = isDay ? "مشمس" : "صافي";
  } else if (conditionCode >= 1 && conditionCode <= 3) {
    Icon = Cloud;
    conditionText = "غائم";
  } else if (conditionCode >= 45 && conditionCode <= 48) {
    Icon = Cloud;
    conditionText = "ضبابي";
  } else if (conditionCode >= 51 && conditionCode <= 67) {
    Icon = CloudRain;
    conditionText = "ممطر";
  } else if (conditionCode >= 71 && conditionCode <= 77) {
    Icon = CloudSnow;
    conditionText = "مثلج";
  } else if (conditionCode >= 80 && conditionCode <= 82) {
    Icon = CloudRain;
    conditionText = "زخات مطر";
  } else if (conditionCode >= 95 && conditionCode <= 99) {
    Icon = CloudLightning;
    conditionText = "عاصف";
  }

  return (
    <div className="cut-crystal-satin px-3 py-1.5 text-[#2b1a10] inline-flex items-center gap-1.5 text-[11.5px] font-semibold shadow-sm mb-1.5">
      <Icon className="h-3.5 w-3.5 text-[#deab65]" />
      <span>{temp}° مئوية</span>
      <span className="opacity-40 text-[9px]">•</span>
      <span>{conditionText}</span>
    </div>
  );
}
