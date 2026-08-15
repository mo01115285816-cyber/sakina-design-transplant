# إصلاح انهيار تصميم Android — 2026-08-15

## السبب الجذري

كان أمر البناء العام يستخدم Vite production، بينما كان `vite.config.ts` يضع `base: "/"` في production. هذا صحيح لموقع Vercel لكنه غير مناسب لحزمة Capacitor التي تحتاج أصولًا نسبية من `dist`. أضيف وضع `android` مستقل يستخدم `base: "./"`، مع بقاء بناء الويب على `/`.

كما كان `src/index.css` يضع `@import` بعد `@font-face`. نُقلت imports إلى أول الملف دون تغيير أي token أو class تصميمي، حتى يعمل Tailwind v4 و`player.css` وفق ترتيب CSS الصحيح.

## الإصلاحات التقنية

| الملف | الإصلاح |
|---|---|
| `vite.config.ts` | `mode=android` يستخدم `base: './'`، والويب يستخدم `/` |
| `package.json` | إضافة `build:android` المخصص لـ Capacitor |
| `src/index.css` | نقل imports إلى بداية الملف فقط |
| `index.html` | إضافة pre-React guard بخلفية مطابقة، وتحويل preload إلى مسارات نسبية |
| `AuroraBackground.tsx` | نقل keyframes إلى `aurora.css` دون تغيير القيم |
| `MainActivity.java` | تسجيل plugins الأربعة قبل `super.onCreate` عبر API Capacitor 8 |

## ما لم يتغير

لم تتغير مكونات الواجهة، أو الألوان، أو الأحجام، أو التخطيطات، أو animations، أو الخطوط، أو prompts الذكاء الاصطناعي. لم يتم تخفيض Tailwind v4 إلى v3، ولم تتم إضافة safe-area padding مع Immersive Mode.

## التحقق

نجح `npm run build` للويب، ونجح `npm run build:android`، ونجحت مزامنة Capacitor، ونجح `assembleDebug`. معاينة Vite بعد اكتمال splash أظهرت الصفحة الرئيسية بالبطاقات والخلفية والصور والأزرار، مع تحميل CSS وfonts وReact بصورة صحيحة. بناء `assembleRelease` حاول التنفيذ لكنه توقف بسبب اختفاء Gradle daemon أثناء ضغط الذاكرة؛ لذلك APK التسليم الحالي هو Debug signed للاختبار، وليس Release production.
