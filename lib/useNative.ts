'use client';

import { useEffect } from 'react';

/**
 * Capacitorのネイティブ機能をまとめたカスタムフック
 * Webブラウザでも動作する（Capacitor未インストール時はno-op）
 */

// ハプティクス（振動フィードバック）
export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] });
  } catch {
    // Web環境ではno-op
  }
}

// いいねボタン用ハプティクス
export async function triggerLikeHaptic() {
  await triggerHaptic('medium');
}

// ステータスバーの設定
export async function setupStatusBar() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#ffffff' });
  } catch {
    // Web環境ではno-op
  }
}

// Androidのバックボタン処理
export function useAndroidBackButton(onBack?: () => void) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          if (onBack) {
            onBack();
          } else if (canGoBack) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });
        cleanup = () => listener.remove();
      } catch {
        // Web環境ではno-op
      }
    })();

    return () => cleanup?.();
  }, [onBack]);
}

// アプリ起動時の初期化
export async function initNativeApp() {
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await setupStatusBar();
    await SplashScreen.hide();
  } catch {
    // Web環境ではno-op
  }
}

// プッシュ通知の初期化
export async function initPushNotifications(
  onNotification?: (data: Record<string, unknown>) => void
) {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return;

    await PushNotifications.register();

    await PushNotifications.addListener('registration', (token) => {
      console.log('[Push] Token:', token.value);
      // TODO: このtokenをSupabaseのusersテーブルに保存する
      // supabase.from('users').update({ push_token: token.value }).eq('id', userId)
    });

    if (onNotification) {
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        onNotification(notification.data as Record<string, unknown>);
      });
    }
  } catch {
    // Web環境ではno-op
  }
}
