# Android ビルドセットアップ

## 前提

- Android Studio(SDK Platform 33 以上 + Build-Tools)
- gradle CLI ビルドは Android Studio 同梱の JBR(Java 21)を使う

## 手順

1. `android/local.properties` を作成(初回のみ。Android Studio で android/ を一度開くと自動生成される):

   ```properties
   sdk.dir=C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk
   ```

2. CLI でビルドする場合は JAVA_HOME を JBR に向ける:

   ```powershell
   $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
   ```

3. Web 資産のビルドと同期 → APK 作成:

   ```powershell
   npm run android:sync
   cd android
   .\gradlew.bat assembleDebug
   ```

   APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## 実機でモック API に繋ぐ

`.env.android` の `VITE_API_BASE_URL` を開発PCの LAN IP(例 `http://192.168.0.10:4010`)にし、
PC 側で `npm run mock:prism` を起動しておく。端末と PC は同一 Wi-Fi に接続すること。
