# External evidence used in the Android hardening investigation

## Egypt DST

1. https://www.timeanddate.com/time/change/egypt/cairo

The page states that Cairo changes clocks at 12:00 midnight local time. Its 2026 table lists the DST start as Friday, April 24, 2026 and the end as Friday, October 30, 2026 at 12:00 midnight. This means the code must convert the local transition boundary to UTC using the pre-transition offset at start and the daylight offset at end.

2. https://www.egyptindependent.com/egypt-to-begin-daylight-saving-time-2026-in-april/

The March 27, 2026 article states that Law No. 24 of 2023 advances Egypt's legal time from midnight on the last Friday of April and keeps it until the end of the last Thursday of October. The implementation therefore treats the end boundary as midnight after the last Thursday, not midnight at the beginning of that Thursday.

## Android foreground services

3. https://developer.android.com/about/versions/14/changes/fgs-types-required

Android's official documentation states that Android 14-targeting apps must declare an appropriate foreground-service type and the corresponding permission. For `specialUse`, the documentation requires the `FOREGROUND_SERVICE_SPECIAL_USE` permission and says developers should declare the use case with a `<property>` inside the service declaration.

4. https://developer.android.com/develop/background-work/services/fgs/service-types

The official service-types documentation repeats that `specialUse` requires a manifest use-case property and that `mediaPlayback` is the appropriate type for continued audio/video playback. It also documents Android 15 restrictions on launching media playback foreground services from `BOOT_COMPLETED`.
