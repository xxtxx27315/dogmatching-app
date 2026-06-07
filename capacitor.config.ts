import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.matchingapp.ver1',
  appName: 'マッチングアプリ',
  webDir: 'out',

  server: {
    url: 'https://dogmatching-app.vercel.app',
    cleartext: false,
  },

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
