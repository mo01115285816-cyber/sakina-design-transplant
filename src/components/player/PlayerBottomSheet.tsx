import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

export interface BottomSheetOption {
  value: any;
  label: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: BottomSheetOption[];
  currentValue: any;
  onSelect: (value: any) => void;
}

export function PlayerBottomSheet({ isOpen, onClose, title, options, currentValue, onSelect }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2b1a10]/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-50 player-bottom-sheet rounded-t-[32px] p-6 pb-10 flex flex-col max-h-[80vh] text-[#2b1a10]"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-[#2b1a10]/20 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between pb-4 border-b border-[#2b1a10]/10 mb-2">
              <h3 className="text-[16px] font-bold text-[#2b1a10]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2b1a10]/5 text-[#7f6a55] hover:text-[#2b1a10] active:scale-95 transition-transform"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto player-hide-scrollbar" dir="rtl">
              {options.map((opt) => {
                const isCurrent = currentValue === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    onClick={() => {
                      onSelect(opt.value);
                      onClose();
                    }}
                    className="w-full py-4 flex items-center justify-between gap-4 transition-colors duration-150 text-right group border-b border-[#2b1a10]/08 last:border-0"
                  >
                    <span
                      className={`text-[15px] transition-colors ${
                        isCurrent ? "text-[#b88a4f] font-bold" : "text-[#2b1a10] font-medium"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-[#deab65] to-[#b88a4f] text-white shadow-sm"
                          : "bg-[#2b1a10]/08"
                      }`}
                    >
                      {isCurrent ? (
                        <Check size={14} strokeWidth={3} />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
