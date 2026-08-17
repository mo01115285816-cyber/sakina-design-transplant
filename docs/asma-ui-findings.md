# Asma Al-Husna UI Findings

The current Asma screen showed the name-of-the-day banner with `meaningDetail` rendered directly under the selected name, which caused the banner to expand. The action button already opens the selected-name details modal, so the description can be hidden from the banner without changing selection logic.

The main App bottom navigation uses a capsule with `fixed inset-x-0 bottom-6`, inner `flex items-center gap-1 rounded-[32px] cut-crystal-capsule px-1.5 py-1.5 shadow-lg`, buttons with `rounded-[24px] px-5 py-2`, a `layoutId="activeTabIndicator"` spring indicator, and `AnimatePresence mode="popLayout"` for label width/opacity animation. The Asma screen used a different capsule, spacing, active indicator, and label transition before the correction.

The updated Asma preview build rendered successfully at `http://127.0.0.1:4178/`; the main nav DOM contained four buttons and the active main label. Further interaction testing will open the Azkar/Asma route and verify the corrected banner and internal nav states.


The preview transitioned to the Azkar screen successfully. The notification onboarding appeared in the clean preview because the browser permission state was reset; it was closed for the interaction test. The Asma quick banner was visible as the first Azkar card and remained the target for the next click.


The updated Asma preview showed the banner text as exactly `اسم اليوم المختار`, the selected Arabic name, and `تأمل في معاني الاسم`; the long meaning detail was absent. DOM measurements confirmed the Asma nav uses the main nav shell and button classes exactly: fixed bottom-6 outer nav, `rounded-[32px]` capsule with `px-1.5 py-1.5`, and `rounded-[24px] px-5 py-2` buttons. The first active indicator and label were present with the main-nav animation structure. The favorites tab was then clicked for state-transition verification.


The favorites state transitioned to an empty-state view with the active `المفضلة (0)` label, and the first nav button was then clicked to return to the main tab. The nav remained fixed and used the same shell dimensions and motion structure.


The main Asma tab returned correctly. The banner remained compact: it rendered only the heading, `الْحَلِيمُ`, and the `تأمل في معاني الاسم` action, with no `meaningDetail` paragraph. The preview screenshot showed the shortened banner and the new capsule nav at the bottom.


Clicking `تأمل في معاني الاسم` opened the existing details modal. The detailed meaning, proof, and reflection appeared inside the modal as intended, while the banner behind it remained the compact name-only presentation. This confirms the description is now deferred until explicit user action.
