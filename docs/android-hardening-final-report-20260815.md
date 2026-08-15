# تقرير التحقيق والإصلاح النهائي لتطبيق سَكِينَة على Android

**التاريخ:** 15 أغسطس 2026

## نطاق التنفيذ والقيود

تم تنفيذ التحقيق وفق ترتيب: تحليل المشكلة، تتبع مسار الكود، تحديد السبب الجذري، التحقق من التشخيص، تنفيذ الإصلاح البنيوي، مراجعة التأثيرات الجانبية، الاختبار، ثم الاعتماد. لم يتم ضغط أو تحويل أو حذف أو نقل أي صورة أو خط أو فيديو أو ملف QCF، ولم يتم تغيير حجم هذه الأصول أو محتواها. ما تم تغييره يقتصر على الكود، إعدادات البناء، الشبكة، Android lifecycle، الاعتماديات، ومسارات التشغيل.

> لا يُعد الإصلاح معتمدًا لمجرد اختفاء عرض واحد؛ الاعتماد هنا مبني على اختبارات المصدر والبناء والحزمة، مع إبقاء اختبار الجهاز الحقيقي معلنًا كحد مستقل لا يمكن إثباته من بيئة sandbox.

## الأسباب الجذرية المثبتة والإصلاحات

| المجال | الدليل من الكود | الإصلاح البنيوي | الأثر على الأصول والتصميم |
|---|---|---|---|
| keystore | كان `sakeenah-upload-key.jks` متتبعًا في مستودع عام وله تاريخ Git | إزالة الملف من working tree والتاريخ المحلي، إضافة قواعد ignore، وإنشاء مفتاح Release جديد خارج المستودع | لا أثر على الصور أو الخطوط أو الواجهة |
| cleartext | `capacitor.config.ts` كان يفعّل `cleartext` و`allowMixedContent`، كما كان manifest المدمج يحقن `usesCleartextTraffic=true` | تعطيل الاثنين، إضافة `usesCleartextTraffic=false` صريحًا، وحصر الاستثناء الشبكي في نطاق radiojar الموثق فقط | لا تغيير في ملفات الوسائط؛ البث HTTP القديم يظل مقيدًا باستثناء محدد ومعلن |
| صلاحيات زائدة | تتبع المصدر أثبت عدم استخدام location و`USE_EXACT_ALARM` في المسار الحالي | إزالة الصلاحيتين، والإبقاء فقط على الصلاحيات التي يعتمد عليها الكود فعليًا مثل `SCHEDULE_EXACT_ALARM` وoverlay والبطارية | لا تغيير في تصميم أو بيانات التطبيق |
| Capacitor | `core` و`android` و`cli` كانت تُحل بإصدارات مختلفة | توحيدها على 8.5.0 وإضافة `@capacitor/file-transfer` 2.0.5 المتوافق مع Capacitor 8 | لا أثر على الأصول |
| code splitting | `PrayerAlarmService` و`audioCache` كانا مستوردين static وdynamic معًا، وشاشات كبيرة كانت static في App | تحويل الاستخدامات إلى dynamic import، وإضافة React.lazy للشاشات الثقيلة، وإضافة manualChunks للـ vendor | الشكل والـ navigation محفوظان؛ التغيير في توقيت تحميل الكود فقط |
| reproducible build | `pack-qcf-fonts.js` كان يكتب `createdAt` في manifest أثناء البناء | إيقاف الكتابة إلى الملفات المتتبعة؛ build يتحقق ولا يعدّل source | ملفات QCF والخطوط لم تُلمس |
| اعتماد build على الشبكة | فحص CDN كان يُنفّذ مع كل build | جعل فحص CDN اختياريًا عبر `VERIFY_QCF_CDN=1`، مع إبقاء التحقق المحلي الإلزامي | لا تغيير في الخطوط أو QCF |
| Boot recovery | `BootReceiver` كان يحتوي دوالًا تعيد `emptyList()` مع TODO، وكان يتجاهل `QUICKBOOT_POWERON` المعلن في manifest | إضافة `PrayerAlarmStore`، حفظ الأوقات التي جرى جدولتها فعليًا، واستعادتها عبر `goAsync()` بعد BOOT أو QUICKBOOT | لا تغيير في حسابات React أو واجهة المستخدم |
| Immersive lifecycle | `MainActivity.hideSystemBars()` كان يتجاهل الاستثناءات صامتًا ولا يملك fallback عند غياب controller | logging آمن في Debug/Release وlegacy fallback واضح | لا تغيير في سياسة Immersive أو Safe Area |
| specialUse FGS | الخدمة تستخدم `specialUse` دون property المطلوبة في Android 14 | إضافة `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` بقيمة تصف عداد الصلاة الحي | لا تغيير في صوت الأذان أو الوسائط |
| DST | نهاية DST المصرية كانت تُحسب عند بداية آخر خميس، وبداية/نهاية الانتقال لم تُحوّل من منتصف الليل المحلي إلى UTC | تحويل الحدود إلى UTC باستخدام offset الانتقال الصحيح، واختبار بداية ونهاية 2026 | لا تغيير في التصميم أو الأصول |
| Filesystem download | `Filesystem.downloadFile` deprecated في تنزيل الأذان | استخدام `@capacitor/file-transfer` مع `Filesystem.getUri` لمسار الوجهة الكامل | لا تغيير في ملفات الصوت نفسها |

## ملاحظات دقيقة حول الأصول

أظهر التدقيق وجود 399 marker من نوع `/audio/...` داخل chunk بيانات الأذكار. تتبع المصدر أثبت أن هذه القيم موجودة داخل JSON، ولا يوجد أي ملف `public/audio`، ولا يوجد أي caller يستخدم حقل audio في الواجهة الحالية. لذلك لم أعدّل JSON أو أزيل هذه القيم حتى لا أحذف سلوكًا مستقبليًا أو أغيّر بيانات المستخدم بلا دليل. كما أن هذه القيم ليست سبب انهيار CSS أو تصميم Android الحالي.

أما الصور والخطوط وملفات QCF فقد بقيت خارج مسار الإصلاح بالكامل، تنفيذًا للقيد الصريح. أعدادها داخل APK سُجلت فقط للتدقيق: 12 ملفًا تحت images و12 تحت fonts و1209 تحت data، دون تعديل محتواها أو ضغطها.

## نتائج البناء والاختبار

| الاختبار | النتيجة |
|---|---|
| `npx tsc --noEmit` | نجح بلا أخطاء |
| اختبار DST deterministic | نجح: `DST_TESTS_PASSED` |
| `npm run build:android` | نجح |
| تحذير dynamic/static import | اختفى في البناء النهائي |
| تحذير chunks أكبر من 500KB | اختفى؛ main chunk أصبح 124.15KB، وأكبر vendor chunk 442.64KB |
| `npx cap sync android` | نجح |
| `assembleDebug` | نجح |
| `assembleRelease` بالمفتاح الجديد | نجح |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `git diff --check` | نجح |
| `apksigner verify` للـ Release | نجح عبر APK Signature Scheme v2، signers=1 |
| المعاينة النهائية | ظهرت الشاشة الرئيسية والـ CSS والـ chunks بلا JavaScript exception؛ ظهر فقط GPS warning متوقع في sandbox بلا مزود موقع |
| تغيير الصور/الخطوط/الفيديو/QCF | لم توجد ملفات أصول متغيرة في Git diff |

## الملفات الناتجة

نسخة Debug التشخيصية موجودة باسم `sakina-debug-hardening-no-assets-20260815.apk`، ونسخة Release الموقعة بالمفتاح الجديد موجودة باسم `sakina-release-signed-hardening-no-assets-20260815.apk`.

بصمة Release SHA-256 هي:

```text
4f5f2da5bd7767b9ef0ec70572212e8027b22b7af03200d367edbd9075067687
```

نسخة Release تحمل `versionCode=2` و`versionName=2.0` واسم الحزمة `com.sakeenah.app`. تم التحقق من التوقيع بواسطة `apksigner`، ولم تُضمّن كلمة مرور المفتاح أو ملف keystore داخل المشروع أو APK.

## حدود الاعتماد

تم اختبار build والحزمة والمعاينة داخل بيئة Linux/Chromium، وليس على هاتف Android فعلي. لذلك لا يمكن إثبات من هذه البيئة وحدها سلوك notch وgesture navigation ولوحة المفاتيح والإشعارات بعد Doze وإعادة التشغيل وoverlay وfile-transfer على Oppo A78 أو أي جهاز آخر. هذه ليست مشكلة مخفية في الإصلاح، بل حد قياس معلن. إذا ظهر بعد تثبيت Release على الهاتف خلل محدد، فلابد من لقطة شاشة أو logcat من نفس النسخة حتى يتم ربطه بمسار كود مثبت بدل التخمين.

## المراجع الخارجية

[1]: https://www.timeanddate.com/time/change/egypt/cairo "Timeanddate — Daylight Saving Time Changes in Cairo"

[2]: https://www.egyptindependent.com/egypt-to-begin-daylight-saving-time-2026-in-april/ "Egypt Independent — Egypt to begin Daylight Saving Time 2026 in April"

[3]: https://developer.android.com/about/versions/14/changes/fgs-types-required "Android Developers — Foreground service types are required"

[4]: https://developer.android.com/develop/background-work/services/fgs/service-types "Android Developers — Foreground service types"

### References

[1] [Timeanddate — Daylight Saving Time Changes in Cairo][1]

[2] [Egypt Independent — Egypt to begin Daylight Saving Time 2026 in April][2]

[3] [Android Developers — Foreground service types are required][3]

[4] [Android Developers — Foreground service types][4]
