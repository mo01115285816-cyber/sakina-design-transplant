import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sparkles } from "lucide-react";
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/services/auth-service";

type AuthMode = "login" | "signup";

interface AuthScreenProps {
  onBack?: () => void;
  onAuthenticated?: (user: User) => void;
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: typeof Mail;
  togglePassword?: boolean;
}

function authErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة السر غير صحيحة.";
  if (normalized.includes("email not confirmed")) return "يرجى تأكيد بريدك الإلكتروني من الرسالة المرسلة إليك.";
  if (normalized.includes("user already registered")) return "هذا البريد مسجل بالفعل. استخدم تسجيل الدخول بدلًا من إنشاء حساب جديد.";
  if (normalized.includes("password should be at least")) return "يجب أن تكون كلمة السر مكونة من 6 أحرف على الأقل.";
  if (normalized.includes("rate limit")) return "تم تجاوز عدد المحاولات المسموح بها مؤقتًا. حاول بعد قليل.";
  if (normalized.includes("supabase")) return "إعداد المصادقة غير مكتمل. راجع إعدادات الاتصال ثم حاول مرة أخرى.";
  return "تعذر إتمام العملية الآن. راجع البيانات وحاول مرة أخرى.";
}

function AuthField({ label, icon: Icon, togglePassword = false, type = "text", id, ...rest }: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? `auth-${label}`;
  const inputType = togglePassword ? (visible ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-right text-[13px] font-bold text-[#5f5145]">
        {label}
      </label>
      <div className="flex h-[54px] items-center gap-3 rounded-[18px] border border-[#2b1a10]/10 bg-[#f9f5ee]/85 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-[#b88a4f]/75 focus-within:bg-[#fffdf9] focus-within:shadow-[0_0_0_4px_rgba(184,138,79,0.12)]">
        <Icon size={18} strokeWidth={1.8} className="shrink-0 text-[#b88a4f]" aria-hidden="true" />
        <input
          {...rest}
          id={inputId}
          type={inputType}
          className="min-w-0 flex-1 bg-transparent text-right text-[15px] font-bold text-[#2b1a10] outline-none placeholder:text-[#8d8175]/65"
        />
        {togglePassword && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#7f6a55] transition-colors hover:bg-[#ece3d7] hover:text-[#b88a4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b88a4f]/35"
            aria-label={visible ? "إخفاء كلمة السر" : "إظهار كلمة السر"}
          >
            {visible ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
          </button>
        )}
      </div>
    </div>
  );
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

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError("");
    setNotice("");
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
    <main dir="rtl" className="relative min-h-[100dvh] overflow-x-hidden bg-[#ece7de] text-[#2b1a10]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-36 -top-40 h-[420px] w-[420px] rounded-full bg-[#d8b27b]/18 blur-3xl" />
        <div className="absolute -bottom-52 -left-36 h-[500px] w-[500px] rounded-full bg-[#b9a58e]/16 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#2b1a10_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[440px] flex-col px-5 pb-8 pt-5 sm:px-7">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            aria-label="العودة"
            className="grid h-10 w-10 place-items-center rounded-full border border-[#2b1a10]/10 bg-[#f7f2ea]/70 text-[#5f5145] transition-colors hover:bg-[#fffdf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b88a4f]/40 disabled:cursor-default disabled:opacity-0"
          >
            <ArrowRight size={18} strokeWidth={1.8} />
          </button>
          <div className="text-left leading-none">
            <p className="font-sans text-[9px] tracking-[0.3em] text-[#8a6a3d]">SAKINAH</p>
            <p className="mt-1 font-display text-[17px] font-black text-[#2b1a10]">سَكِينَة</p>
          </div>
        </header>

        <section className="mt-10 text-right">
          <div className="mb-5 flex items-center gap-3 text-[#b88a4f]">
            <span className="h-px flex-1 bg-gradient-to-l from-[#b88a4f]/60 to-transparent" />
            <Sparkles size={17} strokeWidth={1.6} aria-hidden="true" />
            <span className="h-px w-10 bg-[#b88a4f]/35" />
          </div>
          <p className="font-sans text-[13px] font-bold text-[#8a6a3d]">طمأنينة في كل يوم</p>
          <h1 className="mt-2 font-display text-[32px] font-black leading-[1.15] tracking-tight text-[#2b1a10]">
            {mode === "login" ? "أهلًا بك في سكينة" : "أنشئ حسابك في سكينة"}
          </h1>
          <p className="mt-3 max-w-[330px] text-[14px] leading-7 text-[#6f6257]">
            {mode === "login" ? "أكمل رحلتك اليومية مع القرآن والأذكار بطمأنينة." : "احفظ رحلتك اليومية واجعل الطمأنينة عادة قريبة منك."}
          </p>
        </section>

        <section className="relative mt-7 overflow-hidden rounded-[26px] bg-[#2b1a10] px-5 py-5 text-[#f7f2ea] shadow-[0_18px_38px_-22px_rgba(43,26,16,0.55)]">
          <div className="pointer-events-none absolute -left-10 -top-16 h-36 w-36 rounded-full border border-[#d8b27b]/25" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-5 -top-11 h-24 w-24 rounded-full border border-[#d8b27b]/20" aria-hidden="true" />
          <p className="relative font-quran text-[19px] leading-[1.9] text-[#f7f2ea]">
            ﴿ أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ ﴾
          </p>
          <p className="relative mt-2 text-[11px] font-bold text-[#d8b27b]">سورة الرعد · ٢٨</p>
        </section>

        <form onSubmit={handleSubmit} className="mt-8" noValidate={false}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-[22px] font-black text-[#2b1a10]">{mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</h2>
          </div>

          <div className="space-y-4">
            <AuthField
              label="البريد الإلكتروني"
              icon={Mail}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
            <AuthField
              label="كلمة السر"
              icon={LockKeyhole}
              togglePassword
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          {mode === "login" && (
            <div className="mt-4 flex items-center justify-between gap-3 text-[12px] font-bold text-[#75685b]">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 accent-[#b88a4f]"
                />
                <span>تذكّرني</span>
              </label>
              <button type="button" onClick={handleForgotPassword} className="text-[#9a713d] underline decoration-[#b88a4f]/40 underline-offset-4 transition-colors hover:text-[#6f4f2b]">
                نسيت كلمة السر؟
              </button>
            </div>
          )}

          {error && <p role="alert" className="mt-4 rounded-2xl border border-[#a66969]/25 bg-[#a66969]/10 px-4 py-3 text-center text-[12px] font-bold leading-6 text-[#7d3f3f]">{error}</p>}
          {notice && <p role="status" className="mt-4 rounded-2xl border border-[#b88a4f]/25 bg-[#b88a4f]/10 px-4 py-3 text-center text-[12px] font-bold leading-6 text-[#73552f]">{notice}</p>}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="mt-6 flex h-13 w-full items-center justify-center rounded-[17px] bg-[#2b1a10] px-5 text-[15px] font-black text-[#f7f2ea] shadow-[0_14px_24px_-16px_rgba(43,26,16,0.85)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-[#3a2417] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b88a4f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7de] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#f7f2ea]/35 border-t-[#f7f2ea]" aria-label="جارٍ التنفيذ" /> : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
          </button>

          <div className="my-6 flex items-center gap-3 text-[11px] font-bold text-[#968a7e]">
            <span className="h-px flex-1 bg-[#2b1a10]/10" />
            <span>أو تابع باستخدام</span>
            <span className="h-px flex-1 bg-[#2b1a10]/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading || googleLoading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-[17px] border border-[#2b1a10]/12 bg-[#f7f2ea]/70 text-[14px] font-black text-[#2b1a10] transition-[transform,background-color] duration-200 hover:bg-[#fffdf9] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b88a4f]/45 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#b88a4f]/30 border-t-[#b88a4f]" aria-label="جارٍ فتح Google" /> : <GoogleIcon />}
            المتابعة باستخدام Google
          </button>
        </form>

        <p className="mt-7 text-center text-[13px] leading-7 text-[#6f6257]">
          {mode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
          <button type="button" onClick={switchMode} className="font-black text-[#9a713d] underline decoration-[#b88a4f]/45 underline-offset-4 transition-colors hover:text-[#6f4f2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b88a4f]/40">
            {mode === "login" ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </button>
        </p>

        <footer className="mt-auto pt-8 text-center text-[11px] leading-6 text-[#8a7d70]">
          بتسجيل الدخول، أنت توافق على <button type="button" className="underline underline-offset-2">الشروط</button> و <button type="button" className="underline underline-offset-2">سياسة الخصوصية</button>
        </footer>
      </div>
    </main>
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
