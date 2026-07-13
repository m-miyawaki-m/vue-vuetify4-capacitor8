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

## エミュレータでの開発

前提: AVD(API 33 以上)が作成済みであること。CLI 実行時は JAVA_HOME を JBR に
向けること(上記手順2)。`10.0.2.2` はエミュレータから見たホストPC(127.0.0.1)の特別な IP。

### エミュレータの起動

```powershell
npm run android:emu            # 最初の AVD を起動(起動済みなら何もしない)
npm run android:emu -- Pixel_7 # AVD 名を指定する場合
```

ブート完了で `EMULATOR READY` と出力される。VS Code タスク版(「android: エミュレータ起動」)は
ライブリロード・APK タスクの前提タスク(dependsOn)になっており、個別に実行しなくてもよい。
SDK の場所は ANDROID_HOME → ANDROID_SDK_ROOT → android/local.properties → OS 既定の順で解決。

### ライブリロード

```powershell
npm run android:dev
```

Vite(3000) + Prism モック(4010) を起動しつつ `cap run android` を実行する。
WebView が `http://10.0.2.2:3000` の開発サーバーを直接読むため、コード保存が即反映される。
API は Vite のプロキシ経由でモックに届く。

- 初回のみ `npm run build` を先に一度実行して `dist/` を作っておくこと(cap sync が要求する)
- ライブリロード設定は `CAP_SERVER_URL` 環境変数があるときだけ有効(capacitor.config.ts)。
  通常の `android:sync` / `android:run` を実行すれば dist 読み込みに戻る

### APK ビルド → インストール → スタンドアローン起動

```powershell
npm run mock:prism    # 別ターミナルで(モック API を使う場合)
npm run android:run
```

`--mode emulator`(`.env.emulator` = API を `http://10.0.2.2:4010` に向ける)でビルドし、
`cap run android` が APK 作成・インストール・起動まで行う。開発サーバーに依存しない
実運用に近い状態で動作確認できる。

## 実機でモック API に繋ぐ

`.env.android` の `VITE_API_BASE_URL` を開発PCの LAN IP(例 `http://192.168.0.10:4010`)にし、
PC 側で `npm run mock:prism` を起動しておく。端末と PC は同一 Wi-Fi に接続すること。

## 既知の制約

- `android/app/src/debug/AndroidManifest.xml` で `usesCleartextTraffic="true"` を debug ビルドのみに
  上書きしている。上記のモック API(http)接続は debug ビルドでのみ有効。
- release ビルドではこのオーバーレイは適用されないため、実 API に接続する場合は HTTPS 必須。
