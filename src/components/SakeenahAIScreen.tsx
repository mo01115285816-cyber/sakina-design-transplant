import React, { useState, useRef, useEffect, startTransition, useMemo } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Send, RefreshCw, ChevronRight, 
  BookOpen, ShieldCheck, Heart, AlertCircle, Bot,
  Check, Copy, Volume2, ThumbsUp, ThumbsDown, Play, Pause, HelpCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Gemini API key — embedded for native APK (no Express server in Capacitor)
const NATIVE_GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// System prompt for Sakeenah AI — Islamic scholarly assistant
const SAKEENAH_SYSTEM_PROMPT = `أنت "سكينة AI" — مساعد ذكي إسلامي متخصص. تجيب بدقة ومسؤولية من القرآن الكريم والكتب الستة في الحديث الشريف (البخاري، مسلم، الترمذي، النسائي، أبو داود، ابن ماجه). 

قواعد صارمة:
1. أجب دائماً باللغة العربية الفصحى
2. استشهد بالآيات القرآنية والأحاديث النبوية مع ذكر المصدر
3. إذا لم تكن متأكداً من إجابة، قل ذلك بوضوح ولا تخمن
4. لا تُفتِ في مسائل خلافية بين المذاهب بل اعرض الآراء باختصار
5. كن محترماً ورحيماً في الرد
6. لا تناقش أي مواضيع سياسية أو مثيرة للجدل
7. ركز على تيسير العبادة وتقريب العبد من ربه`;

// Lazy-initialized Gemini client for native platform
let nativeGeminiClient: GoogleGenAI | null = null;
function getNativeGeminiClient(): GoogleGenAI | null {
  if (!NATIVE_GEMINI_API_KEY) return null;
  if (!nativeGeminiClient) {
    nativeGeminiClient = new GoogleGenAI({ apiKey: NATIVE_GEMINI_API_KEY });
  }
  return nativeGeminiClient;
}

// Check if running on native platform (Capacitor APK)
function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isNew?: boolean;
  isStreaming?: boolean;
};

type SakeenahAIScreenProps = {
  onBack: () => void;
};

const CodeBlock = ({ children }: { children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden border border-[#e6dccf] bg-[#fdfcfb] rounded-[22px] shadow-sm text-left" style={{ direction: 'ltr' }}>
      <div className="flex items-center justify-between px-4 py-2 bg-[#f5ebd9] border-b border-[#e6dccf] text-[#7f6a55] select-none">
        <span className="text-[10px] font-mono font-bold tracking-wider">CODE / TEXT</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[#7f6a55] hover:text-[#b88a4f] transition-colors p-1 rounded-md cursor-pointer"
        >
          {copied ? <Check size={12} className="text-[#b88a4f]" /> : <Copy size={12} />}
          <span className="text-[10px] font-bold">{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-[12.5px] text-[#2b1a10] leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const markdownComponents = {
  h3: ({ children }: any) => (
    <h3 className="text-[16px] font-black text-[#2b1a10] mt-4 mb-2 text-right">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="text-[15px] font-black text-[#2b1a10] mt-3 mb-1 text-right">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p 
      className="text-[14px] leading-relaxed text-[#2b1a10] mb-2 text-right break-words whitespace-pre-wrap"
      dir="auto"
      style={{ unicodeBidi: "plaintext" }}
    >
      {children}
    </p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-black text-[#2b1a10]">
      {children}
    </strong>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      referrerPolicy="no-referrer"
      className="text-[#b88a4f] underline font-bold hover:text-[#deab65] transition-colors inline"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-1.5 mb-3 list-none pr-1">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside space-y-1.5 mb-3 pr-2 text-right">
      {children}
    </ol>
  ),
  li: ({ children, ordered }: any) => {
    if (ordered) {
      return (
        <li 
          className="text-[14px] leading-relaxed text-[#2b1a10] my-0.5 text-right inline-block w-full"
          dir="auto"
          style={{ unicodeBidi: "plaintext" }}
        >
          {children}
        </li>
      );
    }
    return (
      <li 
        className="flex items-start gap-2 text-[14px] leading-relaxed text-[#2b1a10] my-0.5"
        dir="auto"
        style={{ unicodeBidi: "plaintext" }}
      >
        <span className="text-[#b88a4f] mt-1.5 shrink-0 select-none text-[8px]">●</span>
        <span className="flex-1 text-right">{children}</span>
      </li>
    );
  },
  code: ({ className, children, ...props }: any) => {
    const isBlock = typeof children === 'string' && children.includes('\n');
    if (isBlock) {
      return <CodeBlock>{children}</CodeBlock>;
    }
    return (
      <code className="bg-[#f5ebd9] border border-[#e6dccf] rounded-lg px-1.5 py-0.5 mx-0.5 font-mono text-[12.5px] text-[#2b1a10]">
        {children}
      </code>
    );
  },
  blockquote: ({ children }: any) => (
    <blockquote className="border-r-4 border-[#b88a4f] pr-3 my-3 italic text-[#7f6a55] text-right bg-[#f7f2ea]/40 py-1 rounded-l-md">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 border border-[#e6dccf] rounded-xl">
      <table className="w-full text-right border-collapse text-[13px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-[#f7f2ea] text-[#2b1a10] font-black">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-[#e6dccf]/60">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-white/40 transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="p-2.5 font-black border-b border-[#e6dccf]">{children}</th>,
  td: ({ children }: any) => <td className="p-2.5 text-[#2b1a10]/90">{children}</td>,
};

const MarkdownRenderer = ({ content, animate = false, onComplete }: { content: string; animate?: boolean; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState(animate ? "" : content);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(content);
      return;
    }

    const words = content.split(" ");
    let currentIdx = 0;
    
    setDisplayedText(words.slice(0, 1).join(" "));
    
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < words.length) {
        setDisplayedText(words.slice(0, currentIdx + 1).join(" "));
      } else {
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 35);

    return () => clearInterval(interval);
  }, [content, animate]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents as any}
    >
      {displayedText}
    </ReactMarkdown>
  );
};

// Clean Markdown and other non-spoken markers for high-quality Arabic Speech Synthesis
const cleanArabicTextForSpeech = (rawText: string) => {
  let text = rawText;
  
  // Strip code blocks completely
  text = text.replace(/```[\s\S]*?```/g, "");
  
  // Strip inline code
  text = text.replace(/`([^`]+)`/g, "$1");
  
  // Strip bold/italic markdown characters
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  
  // Strip markdown links [text](url) -> only keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  
  // Strip bullet points, list items symbols, headings
  text = text.replace(/^[#\-\*\+\●\s]+/gm, "");
  
  // Strip HTML tags if any
  text = text.replace(/<[^>]*>/g, "");
  
  // Trim spaces and normalize whitespace
  return text.trim();
};

export const SakeenahAIScreen = React.memo(function SakeenahAIScreen({ onBack }: SakeenahAIScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "like" | "dislike">>({});
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedResponseId, setCopiedResponseId] = useState<string | null>(null);
  const [showWelcomeCard, setShowWelcomeCard] = useState(() => {
    return !localStorage.getItem("sakeenah_welcome_dismissed");
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  // Auto-resize the textarea based on its scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 130)}px`;
      setIsMultiline(scrollHeight > 38 || inputValue.includes("\n"));
    } else {
      setIsMultiline(false);
    }
  }, [inputValue]);

  // Find the last assistant message index
  const lastAssistantMessageIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  }, [messages]);

  // Copy helper
  const handleCopyMsgContent = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponseId(msgId);
    setTimeout(() => setCopiedResponseId(null), 2000);
  };

  // Text-To-Speech helper
  const handleSpeech = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (speakingMsgId === msgId) {
        setSpeakingMsgId(null);
        return;
      }
    }

    const cleanText = cleanArabicTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ar";
    
    // Attempt to set Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }
    
    utterance.onend = () => {
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
    };
    
    setSpeakingMsgId(msgId);
    
    // Resume is sometimes necessary on Chrome/Safari before calling speak
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  // Clean up synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Retry/Regenerate last message
  const handleRetry = () => {
    const userMsgs = messages.filter(msg => msg.role === "user");
    if (userMsgs.length > 0) {
      const lastUserText = userMsgs[userMsgs.length - 1].content;
      setMessages(prev => {
        const cleaned = [...prev];
        const lastAiIdx = cleaned.map(msg => msg.role).lastIndexOf("assistant");
        if (lastAiIdx !== -1) {
          cleaned.splice(lastAiIdx, 1);
        }
        return cleaned;
      });
      handleSendMessage(lastUserText);
    }
  };

  // ── PRESET QUESTIONS BANK ──
  const questionBank = useMemo(() => [
    { text: "ما حكم قراءة سورة الكهف يوم الجمعة؟", category: "قرآن" },
    { text: "ما هي شروط صحة الصلاة الخمسة؟", category: "صلاة" },
    { text: "أذكر حديثاً شريفاً في فضل بر الوالدين", category: "حديث" },
    { text: "كيف تكون صلاة قيام الليل بالتفصيل؟", category: "صلاة" },
    { text: "ما هي شروط توبة العبد المقبولة؟", category: "أخلاق" },
    { text: "كيف يحافظ المسلم على خشوعه في الصلاة؟", category: "صلاة" },
    { text: "ما فضل قراءة آية الكرسي دبر كل صلاة؟", category: "قرآن" },
    { text: "هل يصح الوضوء مع وجود طلاء الأظافر؟", category: "فقه" },
    { text: "ما هي كفارة اليمين بالتفصيل؟", category: "فقه" },
    { text: "أريد حديثاً عن فضل حسن الخلق وسعته", category: "حديث" },
    { text: "ما حكم إخراج زكاة الفطر نقداً؟", category: "فقه" },
    { text: "كيف كان هدي النبي ﷺ في الصبر على البلاء؟", category: "سيرة" },
    { text: "ما هي السبع الموبقات التي حذر منها النبي؟", category: "حديث" },
    { text: "ما فضل قراءة القرآن الكريم وحفظه؟", category: "قرآن" },
    { text: "كيفية سجود السهو ومتى يشرع؟", category: "صلاة" },
    { text: "ما هو فضل كفالة اليتيم في الإسلام؟", category: "أخلاق" }
  ], []);

  // Helper to pick 4 random questions without duplicating current ones
  const getRandomQuestions = (currentQuestions: typeof questionBank = []) => {
    const currentTexts = currentQuestions.map(q => q.text);
    const available = questionBank.filter(q => !currentTexts.includes(q.text));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  };

  const [activeQuestions, setActiveQuestions] = useState<typeof questionBank>(() => getRandomQuestions([]));
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshQuestions = () => {
    setRefreshing(true);
    setTimeout(() => {
      setActiveQuestions(getRandomQuestions(activeQuestions));
      setRefreshKey(prev => prev + 1);
      setRefreshing(false);
    }, 300);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "قرآن":
        return BookOpen;
      case "صلاة":
        return ShieldCheck;
      case "أخلاق":
        return Heart;
      case "حديث":
      case "سيرة":
        return Sparkles;
      case "فقه":
      default:
        return HelpCircle;
    }
  };

  // Auto scroll to bottom of chat safely using direct container scrolling
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    const aiMsgId = Math.random().toString();

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      // Native platform (APK): Call Gemini API directly — no Express server
      if (isNativePlatform() && getNativeGeminiClient()) {
        const client = getNativeGeminiClient()!;
        const aiMsg: Message = {
          id: aiMsgId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isNew: false,
          isStreaming: true
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsLoading(false);

        const geminiContents = [
          { role: "user" as const, parts: [{ text: SAKEENAH_SYSTEM_PROMPT }] },
          { role: "model" as const, parts: [{ text: "فهمت. أنا سكينة AI، مساعدك الإسلامي المتخصص. كيف يمكنني مساعدتك؟" }] },
          ...history.map((m) => ({
            role: (m.role === "user" ? "user" : "model") as "user" | "model",
            parts: [{ text: m.content }]
          }))
        ];

        const response = await client.models.generateContentStream({
          model: "gemini-2.0-flash",
          contents: geminiContents,
        });

        let accumulatedContent = "";
        for await (const chunk of response) {
          const text = chunk.text || "";
          if (text) {
            accumulatedContent += text;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId ? { ...msg, content: accumulatedContent } : msg
              )
            );
          }
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
          )
        );
      } else {
        // Web platform: Use Express server SSE endpoint
        const res = await fetch("/api/sakeenah-ai/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: history })
      });

      if (!res.ok) {
        throw new Error("Failed to call Sakeenah AI");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const aiMsg: Message = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isNew: false,
        isStreaming: true
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);

      let accumulatedContent = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6);
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId ? { ...msg, content: accumulatedContent } : msg
                  )
                );
              }
            } catch (e) {
              console.error("Error parsing stream chunk:", e, trimmedLine);
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
        )
      );
      } // end of else (web platform SSE)

    } catch (error) {
      console.error("Sakeenah AI error:", error);
      setMessages((prev) => {
        const index = prev.findIndex((m) => m.id === aiMsgId);
        if (index !== -1) {
          if (prev[index].content.trim()) {
            return prev.map((msg) =>
              msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg
            );
          } else {
            const cleaned = prev.filter((m) => m.id !== aiMsgId);
            const errorMsg: Message = {
              id: Math.random().toString(),
              role: "assistant",
              content: "عذراً، حدث خطأ أثناء بث الإجابة. يرجى المحاولة مرة أخرى.",
              timestamp: new Date()
            };
            return [...cleaned, errorMsg];
          }
        } else {
          const errorMsg: Message = {
            id: Math.random().toString(),
            role: "assistant",
            content: "عذراً، لم أتمكن من الاتصال بالخادم الشرعي حالياً. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.",
            timestamp: new Date()
          };
          return [...prev, errorMsg];
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div dir="rtl" className="mx-auto w-full max-w-[390px] px-5 pt-0 pb-4 font-[Cairo] bg-[#ece7de] h-screen relative flex flex-col overflow-hidden">
      
      {/* Background soft ambient shapes */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#b88a4f]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-[#deab65]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── FLOATING TOP HEADER ── */}
      <div className="absolute top-6 left-5 right-5 flex items-center justify-between z-[45] pointer-events-none">
        {/* Right Element (in RTL): Title Capsule */}
        <div className="h-10 px-5 rounded-full bg-[#fcfaf7]/85 backdrop-blur-md border border-[#e6dccf] shadow-[0_6px_20px_rgba(43,26,16,0.06),0_1px_3px_rgba(43,26,16,0.03)] text-[#2b1a10] flex items-center justify-center gap-1.5 pointer-events-auto transition-all duration-300">
          <Sparkles size={14} className="text-[#b88a4f] animate-pulse" fill="currentColor" />
          <span className="text-[13px] font-black whitespace-nowrap pt-0.5">سكينة AI</span>
        </div>

        {/* Left Elements: Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="w-10 h-10 rounded-full bg-[#fcfaf7]/85 backdrop-blur-md border border-[#e6dccf] shadow-[0_6px_20px_rgba(43,26,16,0.06),0_1px_3px_rgba(43,26,16,0.03)] text-[#7f6a55] hover:text-red-600 hover:border-red-200 hover:bg-white flex items-center justify-center active:scale-[0.95] transition-all duration-300 cursor-pointer"
              aria-label="مسح المحادثة"
              title="مسح المحادثة"
            >
              <RefreshCw size={14} />
            </button>
          )}

          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#fcfaf7]/85 backdrop-blur-md border border-[#e6dccf] shadow-[0_6px_20px_rgba(43,26,16,0.06),0_1px_3px_rgba(43,26,16,0.03)] text-[#2b1a10] hover:text-[#b88a4f] hover:border-[#b88a4f]/40 hover:bg-white flex items-center justify-center active:scale-[0.95] transition-all duration-300 cursor-pointer"
            aria-label="رجوع"
          >
            <ChevronRight size={18} className="mr-0.5" />
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT AREA / EMPTY STATE ── */}
      <div className="flex-1 flex flex-col justify-between relative z-10 overflow-hidden">
        
        {/* Welcome Card Modal Overlay */}
        <AnimatePresence>
          {showWelcomeCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#ece7de]/85 backdrop-blur-md z-[45] flex items-center justify-center p-5"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="w-full max-w-[360px] bg-gradient-to-b from-[#fdfcfb] to-[#f7f2ea] border border-[#e6dccf] rounded-[28px] overflow-hidden shadow-[0_4px_16px_rgba(43,26,16,0.03)]"
              >
                {/* Top accent bar — subtle warm gradient */}
                <div className="h-1.5 bg-gradient-to-r from-[#deab65] via-[#b88a4f] to-[#deab65]" />

                <div className="p-6 flex flex-col items-center text-center">
                  {/* Icon — matches app's rounded square style */}
                  <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#deab65] to-[#b88a4f] flex items-center justify-center shadow-[0_8px_20px_rgba(184,138,79,0.25)] mb-4">
                    <Bot size={30} strokeWidth={1.5} className="text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-[19px] font-black text-[#2b1a10] mb-1">ملاذك الآمن للأسئلة الشرعية</h3>

                  {/* Subtitle */}
                  <p className="text-[13px] text-[#7f6a55] font-bold leading-relaxed mt-2 mb-4 max-w-[280px]">
                    تحدث بحرية تامة وبخصوصية مطلقة دون حرج. سأجيبك بدقة ومسؤولية من القرآن الكريم والكتب الستة في الحديث الشريف.
                  </p>

                  {/* Security badge — subtle, matches app palette */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b88a4f]/[0.08] border border-[#b88a4f]/15 rounded-full text-[11px] font-bold text-[#7f6a55] mb-5">
                    <ShieldCheck size={13} className="text-[#b88a4f]" />
                    <span>خصوصية تامة وسرية مشفرة بنسبة ١٠٠٪</span>
                  </div>

                  {/* CTA button — matches app's dark button style */}
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("sakeenah_welcome_dismissed", "true");
                      setShowWelcomeCard(false);
                    }}
                    className="w-full bg-[#2b1a10] text-[#fff9f1] hover:bg-[#3a2517] active:scale-[0.98] transition-all py-3 rounded-[16px] font-black text-[14px] shadow-[0_4px_12px_rgba(43,26,16,0.15)] cursor-pointer"
                  >
                    بدء المحادثة المباركة
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex-1 overflow-y-auto pt-24 pb-6 flex flex-col items-center justify-start scrollbar-thin hide-scrollbar">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="text-center flex flex-col items-center space-y-4 max-w-[320px] w-full"
            >
              {/* Sleek compact logo for return visit */}
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#deab65] to-[#b88a4f] text-white shadow-[0_6px_20px_rgba(184,138,79,0.18)]">
                <Bot size={28} strokeWidth={1.5} />
              </div>

              <div>
                <h3 className="text-[17px] font-black text-[#2b1a10]">طرح أسئلة شرعية</h3>
                <p className="text-[11.5px] text-[#7f6a55] font-black mt-1">كيف يمكنني مساعدتك اليوم؟</p>
              </div>

              {/* Quick Preset Cards */}
              <div className="w-full pt-4 space-y-2">
                <div className="flex items-center justify-between w-full pr-1 pl-1 mb-1">
                  <p className="text-[11px] font-black text-[#7f6a55] tracking-wider text-right">أسئلة مقترحة شائعة:</p>
                  <button
                    type="button"
                    onClick={handleRefreshQuestions}
                    className="w-7 h-7 bg-[#f7f2ea] border border-[#e6dccf] rounded-full flex items-center justify-center text-[#7f6a55] hover:text-[#b88a4f] active:scale-95 transition-all cursor-pointer shadow-sm"
                    title="تحديث الأسئلة المقترحة"
                  >
                    <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="space-y-2 min-h-[192px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={refreshKey}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-2"
                    >
                      {activeQuestions.map((q) => {
                        const IconComponent = getCategoryIcon(q.category);
                        return (
                          <motion.button
                            key={q.text}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSendMessage(q.text)}
                            className="w-full text-right p-3 bg-white/70 border border-[#e6dccf] rounded-2xl text-[12.5px] font-bold text-[#2b1a10] hover:bg-white transition-all shadow-[0_2px_8px_rgba(43,26,16,0.01)] flex items-center justify-between gap-2 group cursor-pointer"
                          >
                            <span>{q.text}</span>
                            <IconComponent size={13} className="text-[#b88a4f] opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Active Chat Thread */
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-1 pt-24 pb-4 space-y-4 mb-4 scrollbar-thin hide-scrollbar">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              const isLastAI = !isUser && idx === lastAssistantMessageIndex && m.isNew !== true && m.isStreaming !== true;
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                >
                  <div
                    className={
                      isUser
                        ? "p-3.5 rounded-[22px] shadow-[0_4px_16px_rgba(43,26,16,0.03)] max-w-[85%] text-right bg-gradient-to-br from-[#2b1a10] to-[#3a2517] text-[#fff9f1] rounded-[22px] rounded-bl-none"
                        : "w-full text-right bg-transparent border-none shadow-none px-0 py-2 text-[#2b1a10]"
                    }
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-black text-[#b88a4f] select-none">
                        <Sparkles size={11} className="text-[#b88a4f]" />
                        <span>سكينة AI</span>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap">
                      {isUser ? (
                        <p className="text-[14px] leading-relaxed font-bold">{m.content}</p>
                      ) : m.content.trim() === "" && m.isStreaming ? (
                        <div className="flex items-center gap-1.5 py-3 justify-start">
                          <span className="w-2 h-2 rounded-full bg-[#b88a4f] animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 rounded-full bg-[#b88a4f] animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 rounded-full bg-[#b88a4f] animate-bounce"></span>
                        </div>
                      ) : (
                        <MarkdownRenderer 
                          content={m.content} 
                          animate={m.isNew && !m.isStreaming} 
                          onComplete={() => {
                            setMessages((prev) =>
                              prev.map((msg) => (msg.id === m.id ? { ...msg, isNew: false } : msg))
                            );
                          }} 
                        />
                      )}
                    </div>
                    
                    <div className="mt-1.5 text-[9px] opacity-50 font-bold">
                      {m.timestamp.toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>

                    {isLastAI && (
                      <div className="flex items-center gap-4 mt-4 text-[#7f6a55] select-none justify-center border-t border-[#e6dccf]/40 pt-3 max-w-[280px] mx-auto">
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMsgContent(m.id, m.content)}
                          className={`w-8 h-8 rounded-full border border-[#e6dccf] bg-transparent text-[#7f6a55] hover:text-[#b88a4f] hover:bg-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm ${
                            copiedResponseId === m.id ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5" : ""
                          }`}
                          title="نسخ الإجابة"
                        >
                          {copiedResponseId === m.id ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        {/* Listen Button (Speech Synthesis) */}
                        <button
                          type="button"
                          onClick={() => handleSpeech(m.id, m.content)}
                          className={`w-8 h-8 rounded-full border border-[#e6dccf] bg-transparent text-[#7f6a55] hover:text-[#b88a4f] hover:bg-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm ${
                            speakingMsgId === m.id ? "border-[#b88a4f] text-[#b88a4f] bg-white" : ""
                          }`}
                          title={speakingMsgId === m.id ? "إيقاف الاستماع" : "استماع للإجابة"}
                        >
                          {speakingMsgId === m.id ? (
                            <Pause size={14} className="animate-pulse" />
                          ) : (
                            <Play size={14} className="ml-0.5" />
                          )}
                        </button>

                        {/* Thumbs Up Button */}
                        <button
                          type="button"
                          onClick={() => setFeedback(prev => ({ ...prev, [m.id]: prev[m.id] === 'like' ? undefined : 'like' }))}
                          className={`w-8 h-8 rounded-full border border-[#e6dccf] bg-transparent text-[#7f6a55] hover:text-[#b88a4f] hover:bg-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm ${
                            feedback[m.id] === 'like' ? 'border-[#b88a4f] text-[#b88a4f] bg-[#b88a4f]/10' : ''
                          }`}
                          title="أعجبني"
                        >
                          <ThumbsUp size={14} fill={feedback[m.id] === 'like' ? "currentColor" : "none"} />
                        </button>

                        {/* Thumbs Down Button */}
                        <button
                          type="button"
                          onClick={() => setFeedback(prev => ({ ...prev, [m.id]: prev[m.id] === 'dislike' ? undefined : 'dislike' }))}
                          className={`w-8 h-8 rounded-full border border-[#e6dccf] bg-transparent text-[#7f6a55] hover:text-red-500 hover:bg-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm ${
                            feedback[m.id] === 'dislike' ? 'border-red-500/40 text-red-600 bg-red-500/5' : ''
                          }`}
                          title="لم يعجبني"
                        >
                          <ThumbsDown size={14} fill={feedback[m.id] === 'dislike' ? "currentColor" : "none"} />
                        </button>

                        {/* Retry / Regenerate Button */}
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="w-8 h-8 rounded-full border border-[#e6dccf] bg-transparent text-[#7f6a55] hover:text-[#b88a4f] hover:bg-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-sm"
                          title="إعادة المحاولة"
                        >
                          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start w-full pr-1 py-1">
                <span className="shimmer-text text-[15px] font-bold tracking-widest font-sans select-none">
                  Thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ── BOTTOM INPUT FIELD BAR ── */}
        <div className="bg-[#ece7de] pt-2 pb-2 sticky bottom-0 z-20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className={`flex ${
              isMultiline ? "items-end rounded-[22px]" : "items-center rounded-full"
            } gap-2 bg-[#fcfaf7]/90 backdrop-blur-md border border-[#e6dccf] p-1.5 shadow-[0_6px_20px_rgba(43,26,16,0.05)] focus-within:border-[#b88a4f]/60 transition-all duration-300`}
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="اسأل عن أي أمر فقهي أو شرعي..."
              disabled={isLoading}
              rows={1}
              className="flex-1 text-right bg-transparent border-none outline-none px-4 text-[13.5px] font-bold text-[#2b1a10] placeholder-[#7f6a55]/60 disabled:opacity-50 resize-none py-1.5 max-h-[130px] overflow-y-auto leading-relaxed"
            />
            
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                isMultiline ? "mb-0.5" : ""
              } ${
                inputValue.trim() && !isLoading
                  ? "bg-[#b88a4f] text-[#fff9f1] shadow-[0_4px_12px_rgba(184,138,79,0.25)] border border-[#b88a4f]/20 hover:bg-[#a0753e] active:scale-95 cursor-pointer"
                  : "bg-[#e8dfd4]/60 text-[#7f6a55]/40 border border-transparent cursor-not-allowed"
              }`}
              aria-label="إرسال السؤال"
            >
              <Send size={13} className="rotate-180" />
            </motion.button>
          </form>
          <div className="text-center mt-2 flex items-center justify-center gap-1 text-[10px] text-[#7f6a55]/80 font-bold">
            <AlertCircle size={10} className="text-[#b88a4f]" />
            <span>الإجابات تقتصر بدقة على القرآن الكريم والبخاري ومسلم.</span>
          </div>
        </div>

      </div>
    </div>
  );
});

export default SakeenahAIScreen;
