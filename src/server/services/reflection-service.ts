import { getGeminiClient, hasGeminiApiKey } from "./gemini-client";
import type { ReflectionRequest, ReflectionResponse } from "../types";

// The full prompt for AI reflection generation
function buildReflectionPrompt(verseText: string, surahName: string, verseNumber: string | number, tafsirText?: string): string {
  return `أنت عالم مفسر فقيه متبحر في علوم القرآن الكريم وتدبر آياته العظيمة بأسلوب يمس القلوب والوجدان.
مطلوب منك صياغة خاطرة تدبرية إيمانية واحدة عميقة ومؤثرة جداً للآية الكريمة التالية وتفسيرها الميسر المرفق.

الآية الكريمة: "${verseText}"
سورة: "${surahName}"، الآية رقم: ${verseNumber}
التفسير الميسر المعتمد: "${tafsirText || "غير متوفر حالياً"}"

القواعد والتعليمات الإلزامية:
1. يجب أن تكون الخاطرة التدبرية واقعية، عملية، ومؤثرة جداً، ترشد المسلم إلى تطبيق الآية في حياته اليومية وعلاقته بربه وبنفسه وبالخلق.
2. اكتب بلغة عربية فصحى عذبة بليغة ومشرقة للغاية تخاطب الروح والقلب مباشرة.
3. ممنوع تماماً كتابة أي مقدمات (مثل: أهلاً بك، هذه خاطرة، إليك تفصيل...) أو لواحق أو تحيات، ابدأ بالخاطرة التدبرية مباشرة دون أي تمهيد.
4. صِغ الخاطرة في فقرة واحدة مكثفة ومتماسكة (لا تتجاوز 2 إلى 3 أسطر).
5. تأكد من صحة المعنى الإيماني وتوافقه مع تفسير السلف الصالح بنسبة 100%.`;
}

export async function generateReflection(req: ReflectionRequest): Promise<ReflectionResponse> {
  const { verseText, surahName, verseNumber, tafsirText } = req;

  const key = hasGeminiApiKey();
  if (!key) {
    // Beautiful fallback reflection when API key is not present — kept identical to original
    return {
      reflection: `تدبر في قوله تعالى: { ${verseText} } - سورة ${surahName}، آية ${verseNumber}. تفكر في عظمة هذه الكلمات الربانية، فكل حرف في كتاب الله يحمل هداية ونوراً لطريقك، فاستلهم من معانيها السامية ما يقوي إيمانك ويرشد سلوكك اليومي.`
    };
  }

  const ai = getGeminiClient();
  const prompt = buildReflectionPrompt(verseText, surahName, verseNumber, tafsirText);

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  const reflectionText = response.text?.trim() || "";
  return { reflection: reflectionText };
}
