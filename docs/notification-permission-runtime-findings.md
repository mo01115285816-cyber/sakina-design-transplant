# Notification permission runtime findings

- The local preview was opened at `http://127.0.0.1:4173/` after building the Android-mode web bundle.
- The splash screen completed and the main prayer screen rendered normally.
- Browser console reported `Notification.permission: "default"` and platform `web`.
- No notification-permission onboarding modal was visible in the rendered page while permission remained `default`.
- This indicates the first-launch capability check did not reach `setShowBatteryModal(true)` in the browser test, most likely because `locationPermissionFlowDone` did not become true after the browser geolocation flow. The code must be traced and corrected so notification onboarding is not blocked indefinitely by location acquisition.


## Follow-up

- The browser profile had `app_isAutoLocation="false"`, so the location flow was not waiting on geolocation in this run.
- `Notification.permission` remained `"default"`.
- The DOM did not contain either `إشعارات الصلاة` or `التنبيهات الدقيقة`, confirming that the modal was not mounted, not merely hidden below the viewport.
- This is a reproducible first-run onboarding issue in the local web preview and requires tracing the capability-check effect or its platform call before claiming the prompt appears correctly.


## Reload verification

After reloading the local preview and waiting for the splash to finish, the main screen rendered again but the notification onboarding text was still absent. The browser permission state remained `default`, so the expected first-launch prompt was not being mounted in this test profile.


## Bundle and capability confirmation

The browser loaded `App-CQj1kBlh.js`, matching the current `dist` output. Capacitor reported `isNative=false`, platform `web`, `LocalNotifications` available, and `LocalNotifications.checkPermissions()` returned `display: "prompt"`. After reload, `app_isAutoLocation` remained `"false"`, while `Notification.permission` remained `"default"` and the modal text was still absent from the DOM. The issue is therefore not a stale bundle, missing browser notification support, or an Android-only guard.


## Diagnostic log result

A temporary log added to the parent capability effect appeared in the browser console after reload, proving that the capability check did execute. The modal was still absent from the DOM, so the remaining failure is inside the modal's permission-status/render path or in the value returned by its native capability check. Temporary diagnostic logging will be removed before commit.


## Modal diagnostic result

The temporary modal log also appeared, proving that the modal component mounted and executed its permission-status loader. Nevertheless, the rendered page still did not contain the onboarding text. The remaining cause is the modal's render guard: its `currentRequiredStep` is transiently undefined during the initial asynchronous status load, and the effect can dismiss the modal when `statusLoaded` becomes true while `steps` is still observed as empty in a render cycle. The render lifecycle should be made explicit so loading state never invokes dismissal and the first required step is shown once statuses are loaded.


## Fixed runtime verification

After the `currentStep` guard was corrected, the local preview displayed the notification onboarding in the DOM and screenshot. The visible step was `إشعارات الصلاة`, with the explanation, `تفعيل الآن`, and `لاحقاً`; the main application remained rendered behind the overlay. This confirms the first-launch permission UI is now mounted and visible when notification state is `default`.


## Final clean-build verification

After removing all temporary logs and rebuilding, the browser preview again displayed the `إشعارات الصلاة` modal after the splash screen. The overlay showed the permission explanation and the two expected actions, `تفعيل الآن` and `لاحقاً`, while the prayer screen remained rendered behind it. This confirms the fix survives a clean production-style build.
