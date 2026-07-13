# 新プロジェクト土台設計: vue-vuetify4-capacitor8

作成日: 2026-07-13

## 1. 目的・位置づけ

現行プロジェクト(`vue-vuetify3-orval-material`)で確立した知見(orval + zod + vue-query の責務分離、共通層、グローバルローディング等)を活かしつつ、サンプルページ群などの不要物を持ち込まない**クリーンな土台**を新規に作る。

- 業務ドメイン: 倉庫内作業アプリ(QR・バーコード読み取り)
- 業務機能: **入庫・出庫・現品調査** の3機能(土台完成後に追加)
- 必要な既存機能(スキャナー等)は土台完成後に個別判断で移植する

## 2. 技術スタック

| 区分 | 採用 |
|---|---|
| フレームワーク | Vue 3 + Vuetify 4 + Vite |
| ネイティブ | Capacitor 8(Android) |
| API層 | OpenAPI(手書き) → orval 生成(vue-query フック + zod スキーマ) |
| HTTP | axios(カスタム mutator 1本) |
| 状態管理 | サーバー状態 = vue-query / クライアント状態 = Pinia |
| モック | Prism(openapi/api.yaml から起動) |
| テスト | Vitest(ユニット) + Playwright(E2E、Prism 相手) |

## 3. ディレクトリ構造(フィーチャーベース)

「1機能 = 1フォルダ」「消すときに1フォルダで消せる」を原則とする。

```
vue-vuetify4-capacitor8/
├── openapi/api.yaml              # 手で書く唯一のAPI定義
├── orval.config.ts
├── capacitor.config.ts
├── vite.config.ts / vitest.config.ts / playwright.config.ts
├── e2e/                          # Playwright(Prismモック相手)
├── android/                      # cap add android の生成物(コミットする)
├── docs/
├── scripts/
└── src/
    ├── app/                      # 起動・配線のみ
    │   ├── main.ts / App.vue
    │   ├── router/index.ts       # ルート定義を一元化
    │   └── plugins/              # vuetify.ts, query.ts, pinia.ts
    ├── features/                 # ★ 1機能 = 1フォルダ
    │   ├── products/             # 商品マスタ照会(土台フェーズで作る見本)
    │   │   ├── pages/
    │   │   ├── components/
    │   │   ├── composables/
    │   │   ├── stores/
    │   │   ├── types.ts
    │   │   └── __tests__/
    │   ├── inbound/              # 入庫(将来)
    │   ├── outbound/             # 出庫(将来)
    │   └── stocktaking/          # 現品調査(将来)
    └── shared/                   # 機能横断のものだけ
        ├── api/
        │   ├── mutator.ts        # axios カスタムインスタンス
        │   └── generated/        # orval 出力。手編集禁止・lint対象外
        ├── components/
        │   └── layout/           # MainLayout.vue, AppLoadingOverlay.vue
        ├── composables/          # useGlobalLoading, useNotify 等
        └── utils/
```

**feature / shared の判断ルール**: 2つ以上の feature から使われたら shared へ昇格。

**命名規約**: コンポーネント = PascalCase、composable = `use*`、ページ = `*Page.vue`。

## 4. データフロー

```
openapi/api.yaml
   │ npm run orval
   ▼
src/shared/api/generated/     ← vue-query フック + zod スキーマ。手編集禁止
   ▼
features/<機能>/composables/   ← 生成フックをラップし機能の都合を吸収
   ▼
features/<機能>/pages/ + components/   ← 生成コードを直接 import しない
```

- サーバー状態は vue-query、画面をまたぐ選択値・設定などのクライアント状態だけ Pinia
- axios は `shared/api/mutator.ts` の1インスタンスに集約。ベースURL切替とエラー共通処理はここ

## 5. API 設計(最小 OpenAPI)

入庫・出庫・現品調査はいずれも「スキャン → 商品照合 → 数量入力 → 記録登録」の同型フローであるため、照合(products)と登録(stock-movements)の2リソースで全機能を支える。

| メソッド | パス | 用途 | 確立するパターン |
|---|---|---|---|
| GET | `/products?code=&keyword=` | スキャン値・キーワードで商品照合 | useQuery + クエリパラメータ + queryKey 設計 |
| GET | `/products/{id}` | 商品詳細(現在庫・棚番) | パスパラメータ付き useQuery |
| POST | `/stock-movements` | 入庫・出庫・現品調査の登録 | useMutation + invalidateQueries |

```yaml
Product:
  id:        string   # UUID
  code:      string   # JAN/バーコード値
  name:      string   # 品名
  stock:     integer  # 在庫数
  location:  string   # 棚番(例 "A-03-2")
  updatedAt: string   # date-time

StockMovementRequest:
  productId: string
  type:      "IN" | "OUT" | "ADJUST"   # 入庫 / 出庫 / 現品調査(実数訂正)
  quantity:  integer   # IN/OUT は増減数、ADJUST は実数
  note:      string    # 任意(調査時の差異理由など)
```

POST /products や DELETE は POST /stock-movements と同型のため初期スコープでは作らない。

## 6. 画面設計

### 6.1 検索 → 一覧 → 詳細 の3ページ分割

```
features/products/pages/
├── ProductSearchPage.vue   # /products/search      検索条件の入力(APIを叩かない)
├── ProductListPage.vue     # /products?code=&keyword=   結果一覧
└── ProductDetailPage.vue   # /products/:id          詳細
```

- **検索条件は URL クエリパラメータで持つ**。一覧は route.query を vue-query の queryKey に含める
- Android ハードウェア戻るボタンで一覧に戻った際、キャッシュヒットで再検索なしに即表示
- スキャナーからの直接遷移(`/products?code=xxx`)も同じ一覧ページに合流する

### 6.2 MainLayout(header / main / footer)

全ページが `shared/components/layout/MainLayout.vue` を明示的に使う。

- **ヘッダー**: props で制御(`title`, `show-back` 等)。定型のため slot にしない。特殊化が必要になったら `#header` slot を後付け
- **main / footer**: slot。footer にはページ固有のアクションボタン(確定・登録等)が入る
- ルーターのネストレイアウト方式は採らない(footer のページごと差し替えが煩雑になるため)
- ページ遷移ごとにレイアウトが再マウントされるが、業務アプリでは問題にせずシンプルさを優先

```vue
<template>
  <MainLayout title="商品検索" show-back>
    <ProductSearchForm @submit="goToList" />
    <template #footer>
      <v-btn block color="primary" @click="goToList">検索</v-btn>
    </template>
  </MainLayout>
</template>
```

## 7. グローバルローディング

`AppLoadingOverlay.vue`(v-overlay + v-progress-circular)を App.vue に1個配置。表示中は全画面を覆い二重操作も防ぐ。

状態源は `shared/composables/useGlobalLoading.ts` に2系統を束ねる:

| 系統 | 検知方法 |
|---|---|
| 画面遷移中 | `router.beforeEach` で ON → `afterEach` / `onError` で OFF |
| APIリクエスト中 | vue-query の `useIsFetching` + `useIsMutating` |

```
スピナー表示 = 遷移中 || useIsFetching(初回取得のみ) > 0 || useIsMutating() > 0
```

- **バックグラウンド再取得ではスピナーを回さない**(stale-while-revalidate を殺さないため、predicate で初回取得のみカウント)。ミューテーションは常に対象
- ちらつき防止の表示遅延(200ms)は初期スコープでは入れず、気になったら後付け
- 各 feature のページはローディングについて何も書かない(勝手に回る)

## 8. コーディング規約

### 8.1 Vue ファイルの責務最小化

- `.vue` は「配線」だけ。ページの `<script setup>` は原則「composable を1つ呼んで分割代入する」程度まで薄くする
- if 文やデータ加工が `.vue` に現れたら composable へ移すサイン
- API の型は orval 生成物を使い手書きしない。画面表示用の加工型のみ feature の `types.ts` に定義
- Pinia store は必ず独立ファイル
- コンポーネントは props/emits を型付き宣言。親の store・composable を直接 import しない
- 効果: ロジックのユニットテストがマウント不要で書ける。Vitest の対象は基本 `.ts`

### 8.2 CSS 方針

- レイアウト・余白・文字は Vuetify のユーティリティクラス(`d-flex`, `pa-4`, `ga-2`, `text-h6` 等)と props(`density`, `variant`, `color`)で表現
- 色・トーンは `app/plugins/vuetify.ts` のテーマ定義に集約。色コードの直書き禁止
- `<style scoped>` は原則書かない。書く場合は理由を説明できる例外のみ
- `:deep()` による Vuetify 内部クラスの上書きは禁止(バージョンアップで壊れるため)

## 9. ビルド・実行モード

| モード | コマンド | API向き先 |
|---|---|---|
| ブラウザ開発 | `npm run dev:mock` | Prism (localhost:4010) |
| Android | ビルド → `cap sync` | `.env.android` の URL |
| E2E | `npm run test:e2e` | Prism |

- Capacitor 8 標準の `webDir: 'dist'` 構成
- gradle CLI ビルドは JAVA_HOME を Android Studio の JBR(21) に向ける必要あり。local.properties 含めセットアップ手順を docs に残す

## 10. エラーハンドリング

- mutator の axios interceptor で HTTP エラー捕捉 → `useNotify` 経由で `AppSnackbar` に表示
- vue-query デフォルト(retry 1回・staleTime 30秒等)は `app/plugins/query.ts` に一元定義
- zod パース失敗は「API契約違反」として開発時 console.error + 通知、本番は通知のみ

## 11. テスト戦略

- **Vitest**: feature 内 `__tests__/` に併置。composable・store の単体が主。カバレッジ v8
- **Playwright**: `e2e/` に集約。dev サーバー + Prism を起動し実ブラウザで疎通。初期は「商品一覧が表示される」1本
- サンプル・実験ページは作らない。動作確認は products 機能そのものが担う

## 12. 初期スコープ

1. スキャフォールド一式(本構成 + 各種設定ファイル)
2. products + stock-movements の最小 OpenAPI
3. orval 生成 → 検索・一覧・詳細の3ページ + 在庫登録(useMutation)を貫通
4. MainLayout・グローバルローディング・useNotify の共通層
5. Vitest 2〜3本 + Playwright 1本が通る
6. `cap add android` して Android ビルドが通ることを確認

### スコープ外(土台完成後)

- 入庫・出庫・現品調査の各画面(products のパターン複製で作る)
- バーコードスキャナー移植(@zxing/browser)
- スピナーの表示遅延(ちらつき防止)
- POST /products 等のマスタメンテ系 API
