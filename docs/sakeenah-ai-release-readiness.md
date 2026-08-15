# تقرير جاهزية إطلاق Sakeenah AI

## الخلاصة التنفيذية

تم نقل وظائف Sakeenah AI وQuran Reflection من مسارات Express المحلية إلى Supabase Edge Functions، مع إبقاء Express كمسار rollback محلي غير مستخدم من الواجهة الحالية. الوظائف المنشورة نشطة، وتطلب JWT، وتستخدم مفتاح Gemini من Secrets فقط، والموقع المنشور يستخدم عنوان Edge Function الجديد. بناء الويب وAndroid نجحا، وشجرة Git نظيفة، ونسخة `main` في GitHub مطابقة للنسخة المحلية.

مع ذلك، لا ينبغي وصف النظام بأنه محصّن بنسبة 100%؛ لا يوجد نظام متصل بالإنترنت بهذه الضمانة. الحالة الحالية مناسبة لاختبار حقيقي مضبوط ومرحلة Beta، أما الإطلاق التجاري النهائي فيحتاج أيضًا اختبارًا مصادقًا فعليًا من Android، ونسخة Android Release موقعة، ومراجعة سياسة الخصوصية والنسخ الاحتياطي والمراقبة.

## ما تم تغييره بالضبط

| الطبقة | ما كان موجودًا | ما أصبح موجودًا |
|---|---|---|
| Chat AI | `POST /api/sakeenah-ai/chat/stream` عبر Express | `sakeenah-ai` Edge Function مع SSE متوافق |
| Quran Reflection | `POST /api/quran/reflection` عبر Express | `quran-reflection` Edge Function |
| الاتصال من الواجهة | عنوان `VITE_API_BASE_URL` ومسار Express | اتصال مباشر إلى `https://vmidpocwksqdvsyrvcog.supabase.co/functions/v1/...` |
| المصادقة | Bearer JWT في Express | Bearer JWT، و`verify_jwt=true` على Supabase Function، مع تحقق إضافي داخل الوظيفة |
| مفتاح Gemini | متغير خادم في Express | `GEMINI_API_KEY` داخل Supabase Secrets فقط |
| rate limit | حد Express السابق | عداد خاص داخل schema غير مكشوف، مع دالة محكومة للمستخدم المصادق |
| CORS | CORS الخادم | قائمة Origins صريحة للويب وCapacitor والتطوير المحلي |
| Android | يحتاج عنوان خادم AI منفصل | لا يحتاج `VITE_API_BASE_URL` لمسارات AI بعد النقل |

## هل تغيرت prompts أو طريقة عمل الذكاء الاصطناعي؟

**لا.** أُجريت مقارنة آلية بين prompt الأصلي الموجود في `src/server/services/sakeenah-ai-service.ts` ونسخة Edge Function، وكانت النتيجة `CHAT_PROMPT_IDENTICAL=true`. كما قورنت صيغة prompt الخاصة بالتأمل القرآني وكانت النتيجة `REFLECTION_TEMPLATE_IDENTICAL=true`.

لم تتغير شخصية سَكِينَة، ولا اللغة العربية الفصحى، ولا قواعد التثبت، ولا ترتيب المصادر، ولا شروط الاستشهاد، ولا قواعد Anti-Jailbreak، ولا طريقة التعامل مع الضيق النفسي، ولا قواعد الخروج عن النطاق. ولم يتغير اسم النموذج `gemini-3.5-flash` أو إعداد الحرارة `0.1` في Chat AI. وظل تحويل رسائل `assistant` إلى دور Gemini باسم `model` كما كان.

لم يتغير أيضًا عقد البث: ما زالت الواجهة تستقبل `data: {"text":"..."}` وتنهي الرد عند `data: [DONE]`. التغيير كان في مكان تنفيذ الطلب وحمايته، وليس في التعليمات التي تحدد إجابة سَكِينَة.

## ما تم نشره فعليًا

| المكان | الحالة والتحقق |
|---|---|
| Supabase project `vmidpocwksqdvsyrvcog` | تم تطبيق ترحيلات rate limit وتفعيل الوظائف |
| Supabase `sakeenah-ai` | `ACTIVE`, version 3, `verify_jwt=true` |
| Supabase `quran-reflection` | `ACTIVE`, version 3, `verify_jwt=true` |
| Vercel | الحزمة الحالية تحتوي `functions/v1/sakeenah-ai` ولا تحتوي مسار Express القديم |
| GitHub | commit `d1830e7` على `main`، والنسخة المحلية والبعيدة متطابقتان |
| Android | APK Debug بُني بنجاح؛ SHA-256: `bc206d9f81bc6e95323a912f2a64396ee80b27e81f18aef6104016ad66fac065` |
| الأسرار | لم تُرفع `.env.local` أو Gemini/Google/service-role secrets إلى GitHub أو APK |

ملف APK الناتج هو نسخة Debug للاختبار وليست نسخة Google Play Release موقعة. كما أن ملف APK لم يُرفع إلى GitHub؛ لأنه ملف بناء كبير، وتم الاحتفاظ به كملف تسليم منفصل.

## نتائج الاختبارات الأمنية المنفذة

تم تنفيذ اختبار دخان آمن على الوظائف المنشورة. الطلب بدون Bearer JWT أعاد `401` لكلتا الوظيفتين، وBearer المزيف أعاد `401`، وطريقة HTTP غير المسموحة أعادت `405`، وOrigin غير المسموح أعاد `403`، بينما preflight من أصل Vercel المسموح أعاد `204`.

كما اجتاز المشروع بناء الويب، وتدقيق `git diff --check`، وتدقيق syntax محليًا لملفَي Edge Functions، وبناء Android. وأظهر فحص الصلاحيات أن تنفيذ دوال rate limit محصور في `authenticated` ولا توجد صلاحية تنفيذ لـ `anon` أو `public`، كما أن schema الخاص غير ظاهر ضمن schemas المكشوفة لـ PostgREST.

## ما يجب مراجعته قبل الإطلاق الرسمي

أهم اختبار متبقٍ هو تنفيذ طلب AI مصادق فعليًا من حساب اختبار من الموقع ومن APK، والتأكد من وصول أول chunk ثم `[DONE]`، ومن رفض الرسائل الكبيرة، ومن توقف الحد بعد عدد الطلبات المسموح. اختبارات عدم المصادقة وCORS تمت فعليًا، لكن اختبار الرد الحقيقي يحتاج جلسة مستخدم صالحة ومفتاح Gemini موجودًا في Supabase Secrets.

يجب أيضًا اختبار Google OAuth من APK نفسه، لأن نجاح الموقع يثبت مسار الويب فقط. ينبغي تثبيت APK، تسجيل الدخول عبر Google، التأكد من عودة المتصفح إلى `com.sakeenah.app://auth/callback`، ثم فتح الإعدادات والتأكد من ظهور الحساب.

تحذير Security Advisor الوحيد المتبقي هو **Leaked Password Protection Disabled**. هذا ليس خللًا في الكود الجديد؛ وثائق Supabase توضح أن منع كلمات المرور المسرّبة متاح في Pro وما فوق [1]. وبما أن الخيار غير ظاهر في الحساب الحالي، فلا توجد خطوة يمكن تنفيذها من الكود في الخطة الحالية. يمكن تفعيلها بعد الترقية إن رغب المستخدم، لكنها ليست شرطًا لتشغيل المصادقة أو Edge Functions.

لإطلاق Android رسميًا، يجب إنشاء نسخة Release موقعة بمفتاح إنتاج محفوظ بأمان، وعدم استخدام APK Debug. كما ينبغي إعداد مراقبة سجلات الوظائف، وتدوير مفاتيح Gemini دوريًا، ومراجعة حدود التكلفة، واختبار استعادة النسخ الاحتياطية قبل استقبال مستخدمين حقيقيين.

## كيف تختبر الحماية بنفسك؟

يوجد سكربت قابل لإعادة التشغيل في `scripts/edge-security-smoke-test.sh`. شغله من بيئة لا تطبع قيم المفاتيح:

```bash
set -a
. ./.env.local
set +a
scripts/edge-security-smoke-test.sh
```

لا تستخدم هذا السكربت لإرسال طلبات كثيفة؛ هو اختبار محدود وآمن. للاختبار المصادق، استخدم حساب اختبار حقيقي من التطبيق، ولا تنسخ Access Token إلى ملفات أو رسائل أو GitHub. أرسل عدة طلبات طبيعية، ثم اختبر حجم رسالة يتجاوز الحد، وتأكد أن الوظيفة ترفضه دون كشف تفاصيل Gemini.

## المراجع الرسمية

[1]: https://supabase.com/docs/guides/auth/password-security "Supabase Password Security"
[2]: https://supabase.com/docs/guides/functions/auth "Supabase Securing Edge Functions"
[3]: https://supabase.com/docs/guides/functions/cors "Supabase CORS for Edge Functions"
[4]: https://owasp.org/API-Security/editions/2023/en/0x11-t10/ "OWASP API Security Top 10 2023"
[5]: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/12-API_Testing/00-API_Testing_Overview "OWASP API Testing Overview"
