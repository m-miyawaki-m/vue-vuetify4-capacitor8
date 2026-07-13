# WarehouseScan (vue-vuetify4-capacitor8)

倉庫内作業(入庫・出庫・現品調査)向け Android ハイブリッドアプリの土台。
Android 13(API 33)専用 / PWA 非対応。

設計: `docs/superpowers/specs/2026-07-13-project-foundation-design.md`
Android セットアップ: `docs/setup-android.md`
ルーティング(URL に `#` が付く理由): `docs/routing-hash-mode.md`

## スタック

Vue 3 + Vuetify 4 + Vite / Capacitor 8 / orval(OpenAPI → vue-query + zod) / Pinia / Vitest / Playwright

## 開発

```powershell
npm install
npm run dev:mock   # Vite(3000) + Prism モック(4010)
```

VS Code 利用時は `.vscode/` にタスク(Ctrl+Shift+B でビルド、「タスクの実行」から dev/mock/test 等)・
デバッグ構成(Chrome / Vitest)・推奨拡張機能を定義済み。

## 主要コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev:mock` | 開発サーバー + Prism モック |
| `npm run orval` | openapi/api.yaml から API コード生成 |
| `npm run test:run` | ユニットテスト(Vitest) |
| `npm run test:e2e` | E2E(Playwright、モック自動起動) |
| `npm run android:sync` | Android 向けビルド + cap sync |
| `npm run android:emu` | エミュレータ(AVD)起動 |
| `npm run android:dev` | エミュレータでライブリロード開発 |
| `npm run android:run` | APK ビルド→エミュレータへインストール起動 |
| `npm run lint` / `npm run type-check` | 静的チェック |

## 構造

- `src/app/` — 起動・配線(router / plugins)
- `src/features/<機能>/` — 1機能1フォルダ(pages / components / composables / stores / types)
- `src/shared/` — 機能横断(api / components / composables)。`shared/api/generated/` は orval 出力で手編集禁止

## 規約(抜粋)

- `.vue` は配線のみ。ロジックは composable(`.ts`)へ
- スタイルは Vuetify ユーティリティクラスと props で。`<style scoped>` 原則禁止
- 検索条件は URL クエリで持つ。サーバー状態は vue-query、クライアント状態のみ Pinia
