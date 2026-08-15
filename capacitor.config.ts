import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sakeenah.app',
  appName: 'سَكِينَة',  // الاسم الخارجي فقط — سَكِينَة
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    // Release policy: HTTPS-only WebView; mixed content is intentionally disabled.
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_sakeenah',
      iconColor: '#b88a4f',
      sound: 'azan.wav',
    },
    // القاعدة #4: لا تضع SystemBars أو StatusBar هنا — ستتعارض مع Immersive Mode الأصلي
    // MainActivity.java يهيمن على كل شيء عبر hideSystemBars()
  },
};

export default config;
