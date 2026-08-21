import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, Check, Copy, Download, Loader2, MessageCirclePlus, Share2, X } from "lucide-react";
import { getCurrentSession } from "@/services/auth-service";
import {
  forkSakeenahSharedConversation,
  loadPublicSharedConversation,
  type SharedConversationPayload,
} from "@/services/sakeenah-sharing";

const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.sakeenah.app";
const PENDING_SHARE_TOKEN_KEY = "sakeenah_pending_share_token";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function PublicMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 text-right text-[14px] leading-8 text-[#2b1a10]" dir="auto">{children}</p>,
        strong: ({ children }) => <strong className="font-black text-[#2b1a10]">{children}</strong>,
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-right text-[17px] font-black text-[#2b1a10]">{children}</h3>,
        h4: ({ children }) => <h4 className="mb-2 mt-3 text-right text-[15px] font-black text-[#2b1a10]">{children}</h4>,
        ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pr-5 text-right text-[14px] leading-7">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pr-5 text-right text-[14px] leading-7">{children}</ol>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="font-bold text-[#b88a4f] underline">{children}</a>,
        blockquote: ({ children }) => <blockquote className="my-3 border-r-4 border-[#b88a4f] bg-[#f7f2ea] py-1 pr-3 text-right italic text-[#7f6a55]">{children}</blockquote>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function SharedSakeenahConversationPage({ token }: { token: string }) {
  const [payload, setPayload] = useState<SharedConversationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [continued, setContinued] = useState(false);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    void loadPublicSharedConversation(token)
      .then((next) => {
        if (!disposed) setPayload(next);
      })
      .catch((reason) => {
        if (!disposed) setError(reason instanceof Error ? reason.message : "تعذر تحميل المحادثة.");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [token]);

  const shareUrl = useMemo(() => typeof window === "undefined" ? "" : window.location.href, []);

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const continueConversation = async () => {
    setContinuing(true);
    try {
      const session = await getCurrentSession();
      if (!session?.access_token) {
        localStorage.setItem(PENDING_SHARE_TOKEN_KEY, token);
        window.location.assign("/");
        return;
      }
      const result = await forkSakeenahSharedConversation(token);
      localStorage.setItem("sakeenah_pending_fork_conversation_id", result.conversationId);
      window.location.assign("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر مواصلة المحادثة.");
    } finally {
      setContinuing(false);
    }
  };

  if (loading) {
    return <main dir="rtl" className="flex min-h-[100dvh] items-center justify-center bg-[#ece7de] text-[#7f6a55]"><div className="flex items-center gap-3 text-sm font-bold"><Loader2 size={20} className="animate-spin text-[#b88a4f]" />جارٍ تحميل المحادثة</div></main>;
  }

  if (error || !payload) {
    return <main dir="rtl" className="flex min-h-[100dvh] items-center justify-center bg-[#ece7de] px-5 text-center"><div className="max-w-[420px] rounded-[30px] border border-[#b88a4f]/20 bg-[#fdfbf7] p-7 shadow-lg"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5ebd9] text-[#b88a4f]"><X size={22} /></div><h1 className="font-display text-xl font-black text-[#2b1a10]">المحادثة غير متاحة</h1><p className="mt-3 text-sm font-bold leading-7 text-[#7f6a55]">{error ?? "رابط المشاركة غير صالح أو تم إلغاؤه."}</p><a href="/" className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#b88a4f] px-6 text-sm font-black text-white">العودة إلى سكينة</a></div></main>;
  }

  return (
    <main dir="rtl" className="min-h-[100dvh] bg-[#ece7de] text-[#2b1a10]">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[390px] flex-col overflow-x-hidden px-5 pb-7 pt-0 font-sans">
        <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-[300px] w-[300px] rounded-full bg-[#b88a4f]/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[250px] w-[250px] rounded-full bg-[#deab65]/5 blur-[100px]" />
        <header className="absolute left-5 right-5 top-6 z-20 flex items-center justify-start">
          <a href="/" className="cut-crystal-capsule flex h-10 items-center justify-center gap-1.5 px-5 text-[14.5px] font-display font-black shadow-md"><span>سَكِينَة AI</span></a>
        </header>

        <section className="relative z-10 mt-24 rounded-[26px] border border-[#b88a4f]/20 bg-[#fdfbf7]/75 p-4 shadow-sm backdrop-blur-xl">
          <h1 className="text-right font-display text-[22px] font-black leading-[1.45] text-[#2b1a10]">{payload.conversation.title}</h1>
          <div className="mt-3 rounded-[16px] border border-[#e6dccf] bg-[#f7f2ea] px-3 py-2 text-left text-[9px] font-bold text-[#7f6a55]" dir="ltr">{shareUrl}</div>
          <div className="mt-3 flex flex-wrap justify-end gap-x-4 gap-y-1.5 text-[10px] font-bold text-[#7f6a55]">
            <span>تم الإنشاء: {formatDate(payload.conversation.created_at)}</span>
            <span>تاريخ النشر: {formatDate(payload.share.createdAt)}</span>
          </div>
          <button type="button" onClick={() => void copyLink()} className="mt-3 flex h-8 items-center gap-1.5 rounded-full px-3 text-[10px] font-black text-[#7f6a55] hover:bg-[#f5ebd9] cursor-pointer">{copied ? <Check size={13} /> : <Copy size={13} />}<span>{copied ? "تم نسخ الرابط" : "نسخ رابط المحادثة"}</span></button>
        </section>

        <section className="relative z-10 mt-5 space-y-4">
          {payload.messages.map((message) => message.role === "user" ? (
            <div key={message.id} className="mr-auto max-w-[85%] rounded-[28px] border border-[#2b1a10]/20 bg-gradient-to-br from-[#2b1a10] to-[#3f281a] p-4 text-right text-[14px] font-bold leading-relaxed text-[#fff9f1] shadow-md" dir="auto">{message.content}</div>
          ) : (
            <article key={message.id} className="w-full bg-transparent px-0 py-2 text-right text-[#2b1a10]"><div className="mb-2 flex items-center gap-1.5 text-[11px] font-display font-black text-[#b88a4f] select-none"><span>سكينة AI</span></div><div className="whitespace-pre-wrap"><PublicMarkdown content={message.content} /></div></article>
          ))}
        </section>

        <section className="relative z-10 mt-8 rounded-[30px] border border-[#b88a4f]/25 bg-gradient-to-br from-[#f7f2ea] to-[#ead7bb] p-5 text-right shadow-[0_14px_34px_rgba(43,26,16,0.1)] sm:p-7">
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#b88a4f] text-white shadow-sm"><MessageCirclePlus size={23} /></div><div><h2 className="font-display text-[18px] font-black text-[#2b1a10]">أكمل التدبر والحديث في تطبيق سكينة</h2><p className="mt-2 text-[12px] font-bold leading-6 text-[#7f6a55]">احفظ المحادثة في حسابك، وواصلها بخصوصية داخل تجربة سكينة الكاملة.</p></div></div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse"><button type="button" onClick={() => void continueConversation()} disabled={continuing || continued} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#b88a4f] text-[13px] font-black text-white shadow-sm hover:bg-[#a0753e] disabled:opacity-60 cursor-pointer">{continuing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}{continued ? "تم تجهيز المحادثة" : "مواصلة المحادثة"}</button><a href={ANDROID_STORE_URL} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#b88a4f]/30 text-[13px] font-black text-[#7f6a55] hover:bg-white/50"><Download size={16} />تحميل تطبيق سكينة</a></div>
        </section>
      </div>
    </main>
  );
}
