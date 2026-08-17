# Quran Live Broadcast runtime findings

The new build loaded the main Sakeenah screen successfully from the local preview. The notification onboarding appeared first because the browser permission state was not granted; it was dismissed only for test navigation using the visible `لاحقًا` action. The main screen then rendered normally.

The first navigation click after dismissal opened the existing `أوقات أخرى` expansion rather than the Quran tab because the browser element indices changed after the modal closed. The Quran tab must be selected again using the live DOM labels/attributes rather than stale element indices.

Static verification already passed: the component matches the attached source, both artwork files are real progressive JPEGs at 2048x877, the Vite/Android web build succeeded, the built `dist/images` copies exist, and the dependency audit reported zero high vulnerabilities.


## Station navigation verification

The Quran screen rendered the broadcast card with the SBA artwork and station metadata initially. Clicking the next-station control changed the metadata to `إذاعة القرآن الكريم من القاهرة` and the extracted DOM reported `/images/cairo_radio_artwork.jpg`, while the screenshot showed the Cairo panoramic artwork. This confirms the miniature navigation control switches the active artwork and station text together.


## Playback and wavebar verification

Clicking `استماع مباشر` on the Cairo station changed the card to `جاري الاتصال...` and then to `إيقاف مؤقت`, confirming the audio stream reached the playing state in the browser test. The final screenshot showed the compact equalizer indicator at the far left of the card while playing; the component condition remains `isActiveAndPlaying && !isLoading`, so the wavebars are not mounted during idle or loading states.


## Mobile verification

The Playwright mobile check used a 390x844 viewport and confirmed the card was visible, the initial SBA image loaded at natural width 2048px, and the next-station control switched the source to `/images/cairo_radio_artwork.jpg`. In the headless run the external stream did not reach a playing event, so wavebars remained at zero there; this is a stream/runtime limitation rather than a layout failure.

In the interactive browser session, the Cairo stream reached `إيقاف مؤقت` after connection and the live DOM reported exactly four wavebar elements while playing. The image source remained `/images/cairo_radio_artwork.jpg`. This verifies that wavebars are mounted only during the active, non-loading playback state.
