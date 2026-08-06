import React from "react";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onClose: () => void;
}

export const UnsavedChangesModal = React.memo(function UnsavedChangesModal({
  isOpen,
  onSaveAndClose,
  onDiscardAndClose,
  onClose,
}: UnsavedChangesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2b1a10]/55 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-[340px] cut-crystal-panel rounded-[28px] p-6 shadow-2xl text-center space-y-5 z-10"
          >
            {/* Center Orange Alert Icon */}
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 gem-rim-glow rounded-full flex items-center justify-center text-amber-600">
                <AlertCircle size={28} className="stroke-[2px]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-2">
              <h3 className="text-[19.5px] font-bold text-[#2b1a10]">
                التغييرات غير محفوظة
              </h3>
              <p className="text-[13px] font-medium leading-relaxed text-[#7f6a55]">
                تغييراتك غير محفوظة. هل أنت متأكد من مغادرة هذه الصفحة؟
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              {/* Primary Pill Button */}
              <button
                type="button"
                onClick={onSaveAndClose}
                className="w-full h-11 bg-[#2b1a10] text-[#fff9f1] hover:brightness-110 active:scale-[0.98] transition-all text-[14px] font-bold rounded-full shadow-md cursor-pointer"
              >
                احفظ التغييرات
              </button>

              {/* Secondary Underlined Button */}
              <button
                type="button"
                onClick={onDiscardAndClose}
                className="w-full text-center text-[13px] font-bold text-[#7f6a55] hover:text-[#2b1a10] underline underline-offset-4 decoration-1 decoration-[#7f6a55]/60 cursor-pointer py-1"
              >
                امسح التغييرات
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
