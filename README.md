# سَكِينَة — Sakeenah

سَكِينَة تطبيق إسلامي يعمل على الويب وAndroid، مع مصادقة Supabase، تخزين جلسات آمن على Android، ووظائف Sakeenah AI محمية عبر Supabase Edge Functions.

## التشغيل المحلي

يتطلب المشروع Node.js وnpm.

```bash
npm install
npm run dev
```

ضع إعدادات العميل العامة في `.env.local`، مع إبقاء الملف خارج Git:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

لا تضع `GEMINI_API_KEY` في متغير يبدأ بـ `VITE_`، ولا داخل الموقع أو APK. وظيفة Edge Function تقرأه من Supabase Secrets فقط.

## Sakeenah AI على Supabase

توجد وظيفتان محميتان في `supabase/functions`:

- `sakeenah-ai`: محادثة Sakeenah AI، وتدعم الاستجابة العادية وSSE streaming.
- `quran-reflection`: التأمل القرآني، ويعيد `{ reflection: string }`.

كل وظيفة تتطلب JWT صالحًا، وتتحقق من حجم المدخلات، وتطبق حد الاستخدام، وتستخدم CORS مقيدًا، ولا تسجل Tokens أو محتوى المستخدم. الـ prompts العربية، النموذج، الحرارة، fallback، وعقد SSE محفوظة كما كانت في خادم Express السابق.

يجب حفظ المفتاح السري في:

```text
Supabase Dashboard → Edge Functions → Secrets
GEMINI_API_KEY=<server-only Gemini key>
```

عنوان الوظائف الإنتاجي هو:

```text
https://<project-ref>.supabase.co/functions/v1/sakeenah-ai
https://<project-ref>.supabase.co/functions/v1/quran-reflection
```

الواجهة تستدعي الوظائف مباشرة عبر Supabase؛ لذلك لا تحتاج وظيفة AI إلى `VITE_API_BASE_URL` أو خادم Express خارجي. خادم Express القديم محفوظ مؤقتًا كمسار rollback ولا تستخدمه الواجهة الحالية.

## Vercel

أضف المتغيرات العامة التالية إلى Vercel ثم أعد بناء Production Deployment:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

لا تضف `GEMINI_API_KEY` أو `GOOGLE_CLIENT_SECRET` أو `SUPABASE_SERVICE_ROLE_KEY` إلى Vercel.

## Android

قبل بناء APK:

```bash
npm run build
npx cap sync android
cd android
bash ./gradlew assembleDebug --no-daemon
```

ينتج APK الاختبار في:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

يستخدم Android نفس Supabase Auth وEdge Functions. يجب أن يكون رابط Android التالي مضافًا في Supabase Redirect URLs:

```text
com.sakeenah.app://auth/callback
```

## قاعدة البيانات والأمان

ترحيلات `supabase/migrations` تنشئ ملفات profiles وRLS وتخزين rate limit خاص بوظائف AI. لا يتم منح المستخدمين وصولًا إلى جداول rate limit الداخلية أو وظائفها الخاصة.

يجب تفعيل **Leaked Password Protection** من إعدادات Supabase Auth → Password Security حتى يمنع Supabase استخدام كلمات المرور التي ظهرت في تسريبات معروفة.

## اختبارات أساسية

```bash
npm run build
git diff --check
```

قبل التسليم يجب التحقق من أن الطلبات غير الموثقة إلى الوظيفتين تعيد `401`، وأن Origin غير المسموح به يعيد `403`، وأن متغيرات الأسرار لا تظهر في Vercel bundle أو APK.
