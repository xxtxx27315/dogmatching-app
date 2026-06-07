# Google Play / App Store リリースガイド

## アーキテクチャ概要

```
Next.js (Vercel) ──── Capacitor ──── Android APK / iOS IPA
      ↑                                      ↑
   Web版URL                         ネイティブ機能追加
   をロード                         (通知・ハプティクス等)
```

Capacitorが Vercel にデプロイされた Web アプリを読み込み、
ネイティブ機能（プッシュ通知・ハプティクス・カメラ）を追加した
ハイブリッドアプリとして配布します。

---

## Phase 1: Vercel にデプロイ（必須・先に行う）

### 1-1. GitHubにプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/matching-app.git
git push -u origin main
```

### 1-2. Vercel でデプロイ
1. https://vercel.com → 「Add New Project」
2. GitHubリポジトリを選択
3. 環境変数を設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. デプロイ完了後、URLをメモ（例: `https://matching-app-xxx.vercel.app`）

### 1-3. capacitor.config.ts にURLを設定
```typescript
// capacitor.config.ts の server セクションのコメントを外す
server: {
  url: 'https://matching-app-xxx.vercel.app', // ← 実際のURLに変更
  cleartext: false,
},
```

---

## Phase 2: Capacitor セットアップ

### 2-1. パッケージインストール
```bash
npm install
npx cap init
```
initコマンドで聞かれる項目:
- App name: マッチングアプリ
- App Package ID: com.matchingapp.ver1
- Web dir: out

### 2-2. Androidプロジェクトを追加
```bash
npx cap add android
npx cap sync
```

### 2-3. iOSプロジェクトを追加（Mac + Xcode 必須）
```bash
npx cap add ios
npx cap sync
```

---

## Phase 3: Android ビルド & Google Play 申請

### 3-1. Android Studio をインストール
https://developer.android.com/studio からダウンロード・インストール

### 3-2. Android プロジェクトを開く
```bash
npm run cap:android
# または
npx cap open android
```

### 3-3. アプリアイコン・スプラッシュ画面を設定
`android/app/src/main/res/` フォルダ内:
- `mipmap-*/` → アプリアイコン (512×512 PNG)
- `drawable/splash.png` → スプラッシュ画面

推奨ツール: https://capacitorjs.com/docs/guides/splash-screens-and-icons

```bash
npm install @capacitor/assets -D
npx @capacitor/assets generate
```

### 3-4. 署名付き AAB を生成
Android Studio で:
1. メニュー → Build → Generate Signed Bundle/APK
2. Android App Bundle を選択
3. 新しいキーストアを作成（初回）:
   - Key store path: `matching-app-release.jks`
   - Password: 安全なパスワードを設定（絶対に忘れないこと）
   - Key alias: matching-app-key
4. Release ビルドタイプを選択
5. 生成完了 → `app-release.aab` が生成される

⚠️ キーストアファイル（.jks）は厳重に保管。紛失するとアプリを更新できなくなります。

### 3-5. Google Play Console で申請

1. https://play.google.com/console にアクセス
2. 「アプリを作成」
3. 必要情報を入力:
   - アプリ名
   - デフォルトの言語
   - アプリかゲームか
   - 無料か有料か
4. ストアの掲載情報を設定:
   - 簡単な説明（80文字以内）
   - 詳しい説明（4000文字以内）
   - スクリーンショット（最低2枚）
   - アイコン（512×512 PNG）
   - フィーチャーグラフィック（1024×500 PNG）
5. コンテンツのレーティングを設定
6. プライバシーポリシーURLを設定（必須）
   - `/legal/privacy` ページのVercel URLを使用
7. 内部テスト → AABをアップロード
8. 審査申請

### 3-6. プライバシーポリシー（必須）
Google Play ではマッチングアプリは必ずプライバシーポリシーが必要。
アプリ内の `/legal/privacy` ページをVercelで公開し、そのURLを申請時に使用。

---

## Phase 4: iOS / App Store（将来対応）

### 前提条件
- Mac コンピューター（必須）
- Xcode 15以上
- Apple Developer Program ($99/年)

### 手順概要
```bash
# Macで実行
npx cap open ios
```
1. Xcode でプロジェクトを開く
2. Bundle Identifier を設定: `com.matchingapp.ver1`
3. 署名設定（Apple Developer Accountと紐付け）
4. Archive → App Store Connect にアップロード
5. App Store Connect で申請

---

## プッシュ通知の設定（Android）

### Firebase Cloud Messaging (FCM) セットアップ
1. https://console.firebase.google.com → 新しいプロジェクト作成
2. Android アプリを追加（パッケージ名: `com.matchingapp.ver1`）
3. `google-services.json` をダウンロード
4. `android/app/` フォルダに配置
5. `android/build.gradle` と `android/app/build.gradle` に Firebase を追加

詳細: https://capacitorjs.com/docs/guides/push-notifications-firebase

---

## トラブルシューティング

### ビルドエラー
```bash
# Gradleキャッシュをクリア
cd android && ./gradlew clean

# Capacitorを再同期
npx cap sync android
```

### WebView で画面が真っ白
- `capacitor.config.ts` の `server.url` が正しいか確認
- Vercel側の環境変数（Supabase URL等）が設定されているか確認

### 審査で拒否された場合
- マッチングアプリは「ソーシャル」カテゴリ
- 年齢レーティングは「17+」（出会い系機能がある場合）
- ターゲット年齢を明示すること
