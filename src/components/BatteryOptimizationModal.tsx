import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Shield, Clock, Smartphone, Check } from 'lucide-react';

/**
 * BatteryOptimizationModal — Professional multi-step permission request.
 *
 * This modal ensures the app survives Android's Doze Mode and aggressive
 * manufacturer battery killers (Samsung, Xiaomi, OPPO, Vivo).
 *
 * Steps:
 * 1. Battery Optimization Bypass (all devices)
 * 2. Exact Alarm Permission (Android 12+)
 * 3. Auto-start Settings (Xiaomi/OPPO/Vivo/Samsung only)
 *
 * Shows on every app launch until all permissions are granted.
 * Uses Sakineh's glassmorphic design language.
 */

interface PermissionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

export default function BatteryOptimizationModal({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [needsExactAlarm, setNeedsExactAlarm] = useState(false);
  const [needsAutoStart, setNeedsAutoStart] = useState(false);
  const [isBatteryOptimizationEnabled, setIsBatteryOptimizationEnabled] = useState(false);

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  const loadPermissionStatus = async () => {
    try {
      const { PrayerAlarmService } = await import('@/services/PrayerAlarmService');

      // Check battery optimization
      const batteryEnabled = await PrayerAlarmService.isBatteryOptimizationEnabled();
      setIsBatteryOptimizationEnabled(batteryEnabled);

      // Check exact alarm permission (Android 12+)
      const canSchedule = await PrayerAlarmService.canScheduleExactAlarms();
      setNeedsExactAlarm(!canSchedule);

      // Check if auto-start is needed (Xiaomi/OPPO/Vivo/Samsung)
      const isAggressive = await PrayerAlarmService.isAggressiveManufacturer();
      setNeedsAutoStart(isAggressive);
    } catch (e) {
      console.warn('Failed to load permission status:', e);
    }
  };

  const handleBatteryOptimization = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { PrayerAlarmService } = await import('@/services/PrayerAlarmService');
      await PrayerAlarmService.requestIgnoreBatteryOptimization();
      setCompletedSteps(prev => new Set([...prev, 'battery']));
      setIsBatteryOptimizationEnabled(false);
    } catch (e) {
      console.warn('Battery optimization request failed:', e);
    } finally {
      setIsProcessing(false);
      // Auto-advance to next step after 1 second
      setTimeout(() => setCurrentStep(1), 1000);
    }
  }, []);

  const handleExactAlarm = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { PrayerAlarmService } = await import('@/services/PrayerAlarmService');
      await PrayerAlarmService.requestExactAlarmPermission();
      setCompletedSteps(prev => new Set([...prev, 'exactAlarm']));
      setNeedsExactAlarm(false);
    } catch (e) {
      console.warn('Exact alarm request failed:', e);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (needsAutoStart) {
          setCurrentStep(2);
        } else {
          // All done
          localStorage.setItem('sakeenah_battery_modal_seen', 'true');
          onDismiss();
        }
      }, 1000);
    }
  }, [needsAutoStart, onDismiss]);

  const handleAutoStart = useCallback(async () => {
    setIsProcessing(true);
    try {
      const { PrayerAlarmService } = await import('@/services/PrayerAlarmService');
      await PrayerAlarmService.openAutoStartSettings();
      setCompletedSteps(prev => new Set([...prev, 'autoStart']));
      setNeedsAutoStart(false);
    } catch (e) {
      console.warn('Auto-start request failed:', e);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        localStorage.setItem('sakeenah_battery_modal_seen', 'true');
        onDismiss();
      }, 1000);
    }
  }, [onDismiss]);

  const handleLater = useCallback(() => {
    // Save to localStorage to prevent showing again until app restart
    // User can access this from Settings screen later
    localStorage.setItem('sakeenah_battery_modal_seen', 'true');
    onDismiss();
  }, [onDismiss]);

  // Build dynamic steps based on device requirements
  const steps: PermissionStep[] = [
    {
      id: 'battery',
      title: 'ضبط البطارية',
      description: 'للتأكد من بقاء الأذان على الوقت الصحيح، نحتاج ضبط وضع البطارية للتطبيق على: غير مقيد / السماح بالنشاط في الخلفية.',
      icon: <Settings size={28} className="text-[#b88a4f]" />,
      required: isBatteryOptimizationEnabled,
    },
    ...(needsExactAlarm
      ? [
          {
            id: 'exactAlarm',
            title: 'إذن التنبيهات الدقيقة',
            description: 'يحتاج أندرويد إذن خاص لضمان دقة الأذان بالثانية، حتى في وضع النوم العميق.',
            icon: <Clock size={28} className="text-[#b88a4f]" />,
            required: true,
          },
        ]
      : []),
    ...(needsAutoStart
      ? [
          {
            id: 'autoStart',
            title: 'التشغيل التلقائي',
            description: 'هاتفك يحتاج إضافة التطبيق لقائمة التشغيل التلقائي لضمان عمله في الخلفية.',
            icon: <Smartphone size={28} className="text-[#b88a4f]" />,
            required: true,
          },
        ]
      : []),
  ];

  // Filter to only show required steps
  const requiredSteps = steps.filter(s => s.required);
  const currentRequiredStep = requiredSteps[currentStep];

  // If all steps are completed or not required, dismiss
  useEffect(() => {
    if (currentStep >= requiredSteps.length) {
      localStorage.setItem('sakeenah_battery_modal_seen', 'true');
      onDismiss();
    }
  }, [currentStep, requiredSteps.length, onDismiss]);

  if (!currentRequiredStep) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 backdrop-blur-sm"
        onClick={handleLater}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[390px] bg-[#fdfcfb] rounded-t-[32px] shadow-2xl overflow-hidden"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-[#e6dccf] rounded-full" />
          </div>

          {/* Close Button */}
          <div className="absolute top-4 left-4">
            <button
              onClick={handleLater}
              className="w-8 h-8 rounded-full bg-[#f7f2ea] border border-[#e6dccf] flex items-center justify-center text-[#7f6a55] hover:bg-[#ece7de] transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-8 pt-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {requiredSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-6 bg-[#b88a4f]'
                      : index < currentStep
                      ? 'bg-[#2b1a10]'
                      : 'bg-[#e6dccf]'
                  }`}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-[24px] cut-crystal-panel flex items-center justify-center shadow-md">
                {completedSteps.has(currentRequiredStep.id) ? (
                  <Check size={36} className="text-[#2b1a10]" strokeWidth={2.5} />
                ) : (
                  currentRequiredStep.icon
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[22px] font-display font-black text-[#2b1a10] text-center mb-3">
              {completedSteps.has(currentRequiredStep.id)
                ? 'تم بنجاح ✓'
                : currentRequiredStep.title}
            </h2>

            {/* Description */}
            <p className="text-[14px] text-[#7f6a55] font-bold text-center leading-relaxed mb-8 max-w-[320px] mx-auto">
              {currentRequiredStep.description}
            </p>

            {/* Action Button */}
            {!completedSteps.has(currentRequiredStep.id) && (
              <button
                onClick={
                  currentRequiredStep.id === 'battery'
                    ? handleBatteryOptimization
                    : currentRequiredStep.id === 'exactAlarm'
                    ? handleExactAlarm
                    : handleAutoStart
                }
                disabled={isProcessing}
                className="w-full h-13 bg-[#2b1a10] text-[#fff9f1] hover:brightness-110 active:scale-[0.98] transition-all text-[15px] font-black rounded-[20px] shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#fff9f1]/30 border-t-[#fff9f1] rounded-full animate-spin" />
                    <span>جاري الفتح...</span>
                  </>
                ) : (
                  <>
                    <Settings size={18} />
                    <span>افتح الإعدادات</span>
                  </>
                )}
              </button>
            )}

            {/* Later Link */}
            <div className="text-center mt-4">
              <button
                onClick={handleLater}
                className="text-[13px] font-bold text-[#b88a4f] hover:text-[#deab65] transition-colors underline cursor-pointer"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
