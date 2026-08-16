import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Loader2, Mail } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import logo from "@/assets/images/sakina-login-logo.png";
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/auth-service";
import { AuroraBackground } from "@/components/auth/AuroraBackground";
import { GlassInput } from "@/components/auth/GlassInput";

type AuthMode = "login" | "signup";

interface AuthScreenProps {
  onBack?: () => void;
  onAuthenticated?: (user: User) => void;
}

function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة السر غير صحيحة.";
  if (normalized.includes("email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني أولًا من الرسالة المرسلة إليك.";
  if (normalized.includes("user already registered")) return "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول بدلًا من إنشاء حساب جديد.";
  if (normalized.includes("password should be at least")) return "يجب أن تكون كلمة السر مكونة من 6 أحرف على الأقل.";
  if (normalized.includes("rate limit")) return "تم تجاوز عدد المحاولات المسموح بها مؤقتًا. حاول بعد قليل.";
  if (normalized.includes("supabase")) return "إعداد المصادقة غير مكتمل. راجع إعدادات الاتصال ثم حاول مرة أخرى.";
  return "تعذر إتمام العملية الآن. راجع البيانات وحاول مرة أخرى.";
}

export default function AuthScreen({ onBack, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fieldsStagger = {
    hidden: { opacity: 0, y: 12 },
    show: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.15 + index * 0.06, duration: 0.4, ease: "easeOut" as const },
    }),
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "login") {
        const session = await signInWithEmail(email, password);
        if (session.user) onAuthenticated?.(session.user);
      } else {
        const session = await signUpWithEmail(email, password);
        if (session?.user) {
          onAuthenticated?.(session.user);
        } else {
          setNotice("تم إنشاء الحساب. افتح بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.");
        }
      }
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    setNotice("");
    try {
      await signInWithGoogle();
    } catch (authError) {
      setError(authErrorMessage(authError));
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("اكتب بريدك الإلكتروني أولًا لإرسال رابط استعادة كلمة السر.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    try {
      await sendPasswordReset(email);
      setNotice("تم إرسال رابط استعادة كلمة السر إلى بريدك الإلكتروني.");
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#ece7de] font-sans text-[#2b1a10]">
      <AuroraBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8 pb-10">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="cut-crystal-capsule flex h-10 w-10 items-center justify-center text-[#2b1a10] transition hover:bg-[#fdfcfb] disabled:cursor-default"
            aria-label="رجوع"
            disabled={!onBack}
          >
            <ArrowLeft size={18} className="rotate-180" />
          </button>
          <span className="text-xs tracking-wide text-[#7f6a55]/70">سَكِينَة</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 flex flex-col items-center text-center"
        >
          <div className="cut-crystal-satin grid h-20 w-20 place-items-center rounded-[28px]">
            <img src={logo} alt="سَكِينَة" width={56} height={56} className="h-14 w-14 object-contain" />
          </div>
          <h1 className="mt-5 font-display text-[34px] font-black leading-none tracking-tight text-[#2b1a10]">
            سَكِينَة
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7f6a55]">
            طمأنينة في كل يوم — {mode === "login" ? "أهلًا بعودتك" : "أنشئ حسابك"}
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
          className="cut-crystal-satin relative mt-8 rounded-[28px] p-6"
        >
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

          <div className="flex flex-col gap-4">
            <motion.div custom={0} variants={fieldsStagger} initial="hidden" animate="show">
              <GlassInput
                label="البريد الإلكتروني"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                icon={<Mail size={18} />}
              />
            </motion.div>

            <motion.div custom={1} variants={fieldsStagger} initial="hidden" animate="show">
              <GlassInput
                label="كلمة السر"
                togglePassword
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                icon={<Lock size={18} />}
              />
            </motion.div>

            {mode === "login" && (
              <motion.div
                custom={2}
                variants={fieldsStagger}
                initial="hidden"
                animate="show"
                className="flex items-center justify-between text-[13px]"
              >
                <label className="flex cursor-pointer items-center gap-2 text-[#7f6a55]">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    id="remember"
                  />
                  <span className="grid h-4 w-4 place-items-center rounded-[6px] border border-[#b88a4f]/50 bg-[#fdfcfb]/60 transition peer-checked:border-[#b88a4f] peer-checked:bg-[#b88a4f]">
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M2 6.5 L5 9 L10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>تذكّرني</span>
                </label>
                <button type="button" onClick={handleForgotPassword} className="font-bold text-[#b88a4f] hover:underline">
                  نسيت كلمة السر؟
                </button>
              </motion.div>
            )}

            {error && <p role="alert" className="rounded-2xl bg-red-950/5 px-3 py-2 text-center text-xs font-bold text-red-900">{error}</p>}
            {notice && <p role="status" className="rounded-2xl bg-[#b88a4f]/10 px-3 py-2 text-center text-xs font-bold text-[#7f6a55]">{notice}</p>}

            <motion.button
              custom={3}
              variants={fieldsStagger}
              initial="hidden"
              animate="show"
              type="submit"
              disabled={loading || googleLoading}
              whileTap={{ scale: 0.98 }}
              className="relative mt-2 flex h-13 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#deab65] to-[#b88a4f] py-4 text-[15px] font-black text-white shadow-[0_10px_28px_-10px_rgba(184,138,79,0.55),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(43,26,16,0.16)] transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="pointer-events-none absolute inset-x-3 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/35 to-transparent opacity-60" />
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
            </motion.button>

            <motion.div custom={4} variants={fieldsStagger} initial="hidden" animate="show" className="my-1 flex items-center gap-3 text-[12px] text-[#7f6a55]/70">
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#7f6a55]/25 to-transparent" />
              أو تابع بواسطة
              <span className="h-px flex-1 bg-gradient-to-l from-[#7f6a55]/25 via-[#7f6a55]/25 to-transparent" />
            </motion.div>

            <motion.button
              custom={5}
              variants={fieldsStagger}
              initial="hidden"
              animate="show"
              type="button"
              onClick={handleGoogle}
              disabled={loading || googleLoading}
              whileTap={{ scale: 0.98 }}
              className="flex h-12 items-center justify-center gap-3 rounded-2xl border border-[#2b1a10]/10 bg-[#fdfcfb]/75 text-[14px] font-bold text-[#2b1a10] shadow-[0_4px_16px_-6px_rgba(43,26,16,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:bg-[#fdfcfb] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
              المتابعة باستخدام Google
            </motion.button>

            <motion.button
              custom={6}
              variants={fieldsStagger}
              initial="hidden"
              animate="show"
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNotice(""); }}
              className="flex h-11 items-center justify-center rounded-2xl border border-[#b88a4f]/30 bg-[#b88a4f]/10 text-[14px] font-black text-[#8d6738] transition hover:bg-[#b88a4f]/15 active:scale-[0.98]"
            >
              {mode === "login" ? "إنشاء حساب جديد" : "العودة إلى تسجيل الدخول"}
            </motion.button>
          </div>
        </motion.form>

        <p className="mt-auto pt-8 text-center text-[11px] leading-relaxed text-[#7f6a55]/70">
          بتسجيل الدخول فأنت توافق على <button type="button" className="underline">الشروط</button> و <button type="button" className="underline">سياسة الخصوصية</button>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.94 6.94 0 0 1 5.47 12c0-.74.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 1.5 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.54l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z" />
    </svg>
  );
}
