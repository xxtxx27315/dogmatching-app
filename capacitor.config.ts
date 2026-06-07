import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.matchingapp.ver1',
  appName: 'マッチングアプリ',
  webDir: 'out',

  // ─── 開発時はこちらを有効化（Vercel URLを指定） ───────────────────────
  // server: {
  //   url: 'https://your-app.vercel.app',
  //   cleartext: false,
  // },

  // ─── 本番ビルド時はserver設定をコメントアウトしてstatic exportを使用 ──

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#ffffff',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },

  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false, // 本番はfalse
    backgroundColor: '#ffffff',
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#ffffff',
  },
};

export default config;
