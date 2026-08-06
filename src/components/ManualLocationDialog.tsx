import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Navigation, MapPin, ChevronLeft } from "lucide-react";
import MapLocationPicker from "./MapLocationPicker";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCitySelected: (cityName: string, lat: number, lon: number) => void;
  onAutoLocationRequest: () => void;

  // Current state
  isAutoLocation: boolean;
  setIsAutoLocation: (val: boolean) => void;
  currentCityName: string;
  currentLat: number;
  currentLon: number;
};

export default function ManualLocationDialog({
  isOpen,
  onClose,
  onCitySelected,
  onAutoLocationRequest,
  isAutoLocation,
  setIsAutoLocation,
  currentCityName,
  currentLat,
  currentLon,
}: Props) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Temporary state for the bottom sheet so user can toggle and apply later
  const [tempAutoLocation, setTempAutoLocation] = useState(isAutoLocation);
  const [tempCityName, setTempCityName] = useState(currentCityName);
  const [tempLat, setTempLat] = useState(currentLat);
  const [tempLon, setTempLon] = useState(currentLon);

  useEffect(() => {
    if (isOpen) {
      setTempAutoLocation(isAutoLocation);
      setTempCityName(currentCityName);
      setTempLat(currentLat);
      setTempLon(currentLon);
    }
  }, [isOpen, isAutoLocation, currentCityName, currentLat, currentLon]);

  const handleApply = () => {
    setIsAutoLocation(tempAutoLocation);
    if (tempAutoLocation) {
      onAutoLocationRequest();
    } else {
      onCitySelected(tempCityName, tempLat, tempLon);
    }
    onClose();
  };

  const handleMapLocationSelect = (name: string, lat: number, lon: number) => {
    setTempCityName(name);
    setTempLat(lat);
    setTempLon(lon);
    setShowMapPicker(false);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showMapPicker && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={onClose}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[400px] cut-crystal-panel rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col pt-4 pb-8 px-5"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-[#c2b5a3] rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-center mb-8 relative">
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center cut-crystal-capsule text-[#7f6a55] hover:scale-105 active:scale-95 transition-all absolute left-0"
                >
                  <X size={20} />
                </button>
                <h2 className="text-[20px] font-bold text-[#2b1a10] text-center">
                  تعديل الموقع
                </h2>
              </div>

              <div className="cut-crystal-satin rounded-[24px] p-2 shadow-sm mb-8">
                {/* Auto Location Row */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-[#e6dccf]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f7f2ea] border border-[#e6dccf] flex items-center justify-center text-[#b88a4f]">
                      <Navigation size={16} className="rotate-45" />
                    </div>
                    <span className="text-[16px] font-bold text-[#2b1a10]">
                      تحديد الموقع تلقائي
                    </span>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${tempAutoLocation ? "bg-[#b88a4f]" : "bg-[#e6dccf]"}`}
                    style={{
                      justifyContent: tempAutoLocation
                        ? "flex-end"
                        : "flex-start",
                    }}
                    onClick={() => setTempAutoLocation(!tempAutoLocation)}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 bg-white rounded-full shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  </div>
                </div>

                {/* Manual Location Row */}
                <button
                  disabled={tempAutoLocation}
                  onClick={() => setShowMapPicker(true)}
                  className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${tempAutoLocation ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f7f2ea]/50 rounded-b-[24px]"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f7f2ea] border border-[#e6dccf] flex items-center justify-center text-[#b88a4f]">
                      <MapPin size={16} />
                    </div>
                    <span className="text-[16px] font-bold text-[#2b1a10]">
                      الموقع المحدد
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[14px] font-bold text-[#2b1a10] truncate max-w-[130px] text-left"
                      dir="ltr"
                    >
                      {tempCityName}
                    </span>
                    <ChevronLeft size={20} className="text-[#2b1a10]" />
                  </div>
                </button>
              </div>

              <button
                onClick={handleApply}
                className="w-full bg-[#2b1a10] text-[#fff9f1] rounded-[24px] py-4 text-[17px] font-bold shadow-[0_8px_20px_rgba(43,26,16,0.2)] active:scale-[0.98] transition-all hover:brightness-110 cursor-pointer"
              >
                تطبيق التعديل
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMapPicker && (
          <MapLocationPicker
            initialLat={tempLat}
            initialLon={tempLon}
            onSelect={handleMapLocationSelect}
            onClose={() => setShowMapPicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
