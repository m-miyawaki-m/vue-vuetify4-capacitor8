# 新プロジェクト土台構築 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vue3 + Vuetify4 + orval + zod + vue-query + Pinia + Capacitor8 の倉庫スキャンアプリ土台を、products 機能1本貫通(検索→一覧→詳細→在庫登録)+ 共通層(レイアウト・ローディング・通知・オフライン検知)+ テスト + Android ビルドまで完成させる。

**Architecture:** フィーチャーベース構造(`src/app` / `src/features` / `src/shared`)。OpenAPI(手書き) → orval 生成(vue-query フック + zod)→ feature composable でラップ → ページは配線のみ。サーバー状態 = vue-query、クライアント状態 = Pinia。

**Tech Stack:** Vue 3.5 / Vuetify 4 / Vite 8 / TypeScript 5.9 / Capacitor 8 / orval 8 / zod 4 / @tanstack/vue-query 5 / Pinia 3 / Vitest 4 / Playwright / Prism(モック)

**Spec:** `docs/superpowers/specs/2026-07-13-project-foundation-design.md`

## Global Constraints

- **Android 13 専用**: `android/variables.gradle` の `minSdkVersion = 33`。PWA 資産(Service Worker / manifest / vite-plugin-pwa)は一切作らない
- **`.vue` は配線のみ**: ページの `<script setup>` は「composable を1つ呼んで分割代入」程度。ロジック・型は `.ts` へ
- **CSS**: Vuetify ユーティリティクラスと props のみ。`<style scoped>` 原則禁止、`:deep()` 完全禁止、色コード直書き禁止(テーマは `src/app/plugins/vuetify.ts`)
- **`src/shared/api/generated/` は手編集禁止**(orval 出力。eslint/prettier 対象外)
- **サンプルページ・実験ページは作らない**
- コミットメッセージは日本語 + Conventional Commits(`feat:` `test:` `docs:` `chore:`)
- 作業ディレクトリは `C:\dev\vue-vuetify4-capacitor8`。コマンド例は PowerShell 前提
- **Capacitor 8 が npm で解決できない場合**(8 系未リリース等)は作業を止めてユーザーに報告する(勝手に 7 へ下げない)
- orval 生成物の識別子名(フック名・型名・zod スキーマ名)は Task 4 の生成結果で実名を確認し、以降のタスクでずれがあれば**生成物の実名に合わせる**(生成物を直さない)

---

### Task 1: プロジェクトスキャフォールド(Vite + Vue + TS + Lint)

**Files:**
- Create: `package.json`, `vite.config.mts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json`, `env.d.ts`, `index.html`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.env.development`, `.env.android`, `src/app/main.ts`, `src/app/App.vue`

**Interfaces:**
- Produces: `@` エイリアス = `src/`。dev サーバー port 3000、`/api` → `http://localhost:4010` プロキシ。npm scripts(`dev`, `build`, `type-check`, `lint` ほか)

- [ ] **Step 1: 設定ファイル群を書く**

`package.json`:

```json
{
  "name": "vue-vuetify4-capacitor8",
  "private": true,
  "type": "module",
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "dev:mock": "run-p dev mock:prism",
    "mock:prism": "npx @stoplight/prism-cli mock openapi/api.yaml --port 4010 --cors",
    "build": "run-p type-check \"build-only {@}\" --",
    "build-only": "vite build",
    "build:android": "vite build --mode android",
    "android:sync": "npm run build:android && npx cap sync android",
    "type-check": "vue-tsc --build --force",
    "orval": "orval",
    "test": "vitest",
    "test:run": "vitest run --reporter=verbose",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "lint": "eslint . --fix",
    "format": "prettier --write src e2e"
  },
  "dependencies": {
    "@capacitor/android": "^8.0.0",
    "@capacitor/core": "^8.0.0",
    "@capacitor/network": "^8.0.0",
    "@fontsource/roboto": "^5.2.10",
    "@mdi/font": "^7.4.47",
    "@tanstack/vue-query": "^5.101.0",
    "axios": "^1.17.0",
    "pinia": "^3.0.4",
    "pinia-plugin-persistedstate": "^4.7.1",
    "vue": "^3.5.30",
    "vue-router": "^5.1.0",
    "vuetify": "^4.0.2",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@capacitor/cli": "^8.0.0",
    "@playwright/test": "^1.61.0",
    "@tsconfig/node22": "^22.0.5",
    "@types/node": "^24.12.0",
    "@vitejs/plugin-vue": "^6.0.5",
    "@vitest/coverage-v8": "^4.1.9",
    "@vue/test-utils": "^2.4.11",
    "@vue/tsconfig": "^0.9.0",
    "eslint": "^10.5.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-vue": "^10.9.2",
    "jsdom": "^29.1.1",
    "npm-run-all2": "^8.0.4",
    "orval": "^8.15.0",
    "prettier": "^3.8.4",
    "sass": "^1.100.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.61.1",
    "unplugin-fonts": "^1.4.0",
    "vite": "^8.0.0",
    "vite-plugin-vuetify": "^2.1.3",
    "vitest": "^4.1.9",
    "vue-tsc": "^3.2.5"
  },
  "overrides": {
    "unplugin-fonts": {
      "vite": "^8.0.0"
    }
  }
}
```

`vite.config.mts`:

```ts
import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Fonts from 'unplugin-fonts/vite'
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  base: './',
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    Vuetify({
      autoImport: true,
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
    }),
  ],
  define: { 'process.env': {} },
  optimizeDeps: {
    // autoImport で遅延ルートから初めて import される vuetify/components/* が
    // dev 中の再最適化(フルリロード=初回遷移キャンセル)を起こすため事前バンドル対象から外す
    exclude: ['vuetify'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4010',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

`tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.vitest.json" }
  ]
}
```

`tsconfig.app.json`:

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`tsconfig.node.json`:

```json
{
  "extends": "@tsconfig/node22/tsconfig.json",
  "include": [
    "vite.config.*",
    "vitest.config.*",
    "playwright.config.*",
    "orval.config.*",
    "capacitor.config.*",
    "eslint.config.*"
  ],
  "compilerOptions": {
    "composite": true,
    "noEmit": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  }
}
```

`tsconfig.vitest.json`:

```json
{
  "extends": "./tsconfig.app.json",
  "include": ["env.d.ts", "src/**/__tests__/*", "src/test/**/*"],
  "exclude": [],
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.vitest.tsbuildinfo",
    "lib": [],
    "types": ["node", "jsdom"]
  }
}
```

`env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_DISABLE_OFFLINE_OVERLAY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

`index.html`:

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no"
    />
    <title>WarehouseScan</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

`eslint.config.js`:

```js
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'android/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/shared/api/generated/**', // orval 生成物は lint 対象外
    ],
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  prettier,
)
```

`.prettierrc.json`:

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

`.prettierignore`:

```
dist
android
coverage
playwright-report
test-results
src/shared/api/generated
```

`.gitignore`:

```
node_modules/
dist/
coverage/
playwright-report/
test-results/
*.local
.DS_Store
```

`.env.development`:

```
VITE_API_BASE_URL=/api
```

`.env.android`:

```
# 実機の WebView から見た API の URL。モック検証時は開発PCの LAN IP に置き換える
VITE_API_BASE_URL=http://192.168.0.10:4010
```

`src/app/main.ts`(この時点では最小。Task 6 で配線を足す):

```ts
import { createApp } from 'vue'
import App from '@/app/App.vue'

createApp(App).mount('#app')
```

`src/app/App.vue`(この時点では最小。Task 2/6 で置き換える):

```vue
<template>
  <div>setup</div>
</template>
```

- [ ] **Step 2: インストールとビルド確認**

```powershell
npm install
```

Expected: エラーなし。`@capacitor/core@^8` が解決できず失敗した場合はここで停止してユーザーに報告する。

```powershell
npm run type-check
npm run build-only
npm run lint
```

Expected: すべて exit 0。`dist/index.html` が生成される。

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "chore: Vite + Vue3 + TypeScript + ESLint のスキャフォールド"
```

---

### Task 2: Vuetify プラグイン + Vitest 基盤

**Files:**
- Create: `src/app/plugins/vuetify.ts`, `vitest.config.mts`, `src/test/setup.ts`
- Test: `src/test/__tests__/vuetify.smoke.test.ts`
- Modify: `src/app/main.ts`, `src/app/App.vue`

**Interfaces:**
- Produces: `default export` の Vuetify インスタンス(`@/app/plugins/vuetify`)。テーマ色は `primary` / `secondary` のみ定義。Vitest は `npm run test:run` で実行、環境 jsdom + `src/test/setup.ts`

- [ ] **Step 1: Vuetify プラグインと Vitest 設定を書く**

`src/app/plugins/vuetify.ts`:

```ts
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

// 色・トーンはここに集約する。ページでの色コード直書きは禁止(スペック §8.2)
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
        },
      },
    },
  },
})
```

`vitest.config.mts`:

```ts
import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import Vuetify from 'vite-plugin-vuetify'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [Vue(), Vuetify({ autoImport: true })],
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', 'e2e/**'],
    setupFiles: ['src/test/setup.ts'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/shared/api/generated/**', // orval 生成物
        'src/test/**',
        'src/app/main.ts',
        '**/node_modules/**',
        'e2e/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
})
```

`src/test/setup.ts`:

```ts
// Vuetify が jsdom に存在しない API を使うためのポリフィル
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
```

- [ ] **Step 2: 失敗するスモークテストを書く**

`src/test/__tests__/vuetify.smoke.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import vuetify from '@/app/plugins/vuetify'

describe('Vuetify セットアップ', () => {
  it('v-app 配下で Vuetify コンポーネントが描画できる', () => {
    const Host = defineComponent({
      template: '<v-app><v-btn>OK</v-btn></v-app>',
    })
    const wrapper = mount(Host, { global: { plugins: [vuetify] } })
    expect(wrapper.text()).toContain('OK')
  })
})
```

- [ ] **Step 3: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: この時点で `src/app/plugins/vuetify.ts` を書いていれば PASS する(設定ファイルが正しくない場合に FAIL で気づく)。FAIL したら設定を直す。

- [ ] **Step 4: main.ts / App.vue に Vuetify を配線**

`src/app/main.ts`:

```ts
import { createApp } from 'vue'
import App from '@/app/App.vue'
import vuetify from '@/app/plugins/vuetify'

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
```

`src/app/App.vue`:

```vue
<template>
  <v-app>
    <v-main>
      <div class="pa-4 text-body-1">setup</div>
    </v-main>
  </v-app>
</template>
```

- [ ] **Step 5: 検証と Commit**

```powershell
npm run test:run
npm run type-check
npm run build-only
```

Expected: すべて exit 0。

```powershell
git add -A
git commit -m "feat: Vuetify4 プラグインと Vitest 基盤を追加"
```

---

### Task 3: OpenAPI 仕様書 + Prism モック

**Files:**
- Create: `openapi/api.yaml`

**Interfaces:**
- Produces: operationId = `listProducts` / `getProduct` / `createStockMovement` / `getHealth`。スキーマ = `Product` / `StockMovementRequest` / `StockMovement` / `ErrorResponse`。Prism は port 4010。example の商品名「ボルト M6」「ナット M6」は E2E(Task 12)がそのまま検証に使う

- [ ] **Step 1: OpenAPI 仕様書を書く**

`openapi/api.yaml`:

```yaml
openapi: 3.0.3
info:
  title: Warehouse Scan API
  version: 0.1.0
  description: 倉庫内作業(入庫・出庫・現品調査)向け最小 API
paths:
  /health:
    get:
      operationId: getHealth
      summary: 疎通確認(オフライン復帰の実疎通チェックに使用)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                required: [status]
                properties:
                  status:
                    type: string
              example:
                status: ok
  /products:
    get:
      operationId: listProducts
      summary: 商品照合(コード・キーワード検索)
      parameters:
        - name: code
          in: query
          required: false
          schema:
            type: string
          description: JAN/バーコード値の完全一致
        - name: keyword
          in: query
          required: false
          schema:
            type: string
          description: 品名の部分一致
      responses:
        '200':
          description: 商品一覧
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
              example:
                - id: p-001
                  code: '4901234567894'
                  name: ボルト M6
                  stock: 120
                  location: A-01-1
                  updatedAt: '2026-07-13T09:00:00Z'
                - id: p-002
                  code: '4901234567900'
                  name: ナット M6
                  stock: 300
                  location: A-01-2
                  updatedAt: '2026-07-13T09:00:00Z'
  /products/{id}:
    get:
      operationId: getProduct
      summary: 商品詳細
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 商品
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'
              example:
                id: p-001
                code: '4901234567894'
                name: ボルト M6
                stock: 120
                location: A-01-1
                updatedAt: '2026-07-13T09:00:00Z'
        '404':
          description: 未存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                message: 商品が見つかりません
  /stock-movements:
    post:
      operationId: createStockMovement
      summary: 入庫・出庫・現品調査の登録
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StockMovementRequest'
      responses:
        '201':
          description: 登録済み
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StockMovement'
              example:
                id: m-001
                productId: p-001
                type: IN
                quantity: 10
                note: ''
                createdAt: '2026-07-13T09:30:00Z'
        '400':
          description: 入力不正
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                message: 数量が不正です
components:
  schemas:
    Product:
      type: object
      required: [id, code, name, stock, location, updatedAt]
      properties:
        id:
          type: string
        code:
          type: string
          description: JAN/バーコード値
        name:
          type: string
        stock:
          type: integer
        location:
          type: string
          description: 棚番(例 A-03-2)
        updatedAt:
          type: string
          format: date-time
    StockMovementRequest:
      type: object
      required: [productId, type, quantity]
      properties:
        productId:
          type: string
        type:
          type: string
          enum: [IN, OUT, ADJUST]
          description: IN=入庫 / OUT=出庫 / ADJUST=現品調査(実数訂正)
        quantity:
          type: integer
          description: IN/OUT は増減数、ADJUST は実数
        note:
          type: string
          description: 任意メモ(調査時の差異理由など)
    StockMovement:
      allOf:
        - $ref: '#/components/schemas/StockMovementRequest'
        - type: object
          required: [id, createdAt]
          properties:
            id:
              type: string
            createdAt:
              type: string
              format: date-time
    ErrorResponse:
      type: object
      required: [message]
      properties:
        message:
          type: string
```

- [ ] **Step 2: Prism モックの疎通確認**

```powershell
Start-Process powershell -ArgumentList '-Command', 'npx @stoplight/prism-cli mock openapi/api.yaml --port 4010 --cors' -WindowStyle Hidden
Start-Sleep -Seconds 8
Invoke-RestMethod http://localhost:4010/products | ConvertTo-Json -Depth 5
Invoke-RestMethod http://localhost:4010/health
```

Expected: `/products` が「ボルト M6」「ナット M6」の2件、`/health` が `status: ok` を返す。確認後、起動した Prism プロセスは停止してよい(`Get-Process -Name node | Stop-Process` は他プロセスを巻き込むため、確認したウィンドウを閉じるか `npx kill-port 4010`)。

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: 最小 OpenAPI 仕様書(products / stock-movements / health)を追加"
```

---

### Task 4: orval 設定 + mutator + ApiError + コード生成

**Files:**
- Create: `orval.config.ts`, `src/shared/api/mutator.ts`, `src/shared/api/apiError.ts`
- Test: `src/shared/api/__tests__/apiError.test.ts`
- Create(生成): `src/shared/api/generated/`(orval 出力)

**Interfaces:**
- Consumes: `openapi/api.yaml`(Task 3)
- Produces:
  - `customAxiosInstance<T>(config, options?): Promise<T>` と `axiosInstance`(`@/shared/api/mutator`)
  - `ApiError`(`message`, `status?`)と `toApiError(unknown): ApiError`(`@/shared/api/apiError`)
  - 生成フック(想定名): `useListProducts(params?, options?)` / `useGetProduct(id, options?)` / `useCreateStockMovement(options?)`、zod スキーマ `listProductsResponse` 等。**生成後に実名を確認して記録する**

- [ ] **Step 1: ApiError の失敗するテストを書く**

`src/shared/api/__tests__/apiError.test.ts`:

```ts
import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from '@/shared/api/apiError'

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data,
  })
}

describe('toApiError', () => {
  it('ErrorResponse の message と status を取り出す', () => {
    const error = toApiError(axiosErrorWithResponse(404, { message: '商品が見つかりません' }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('商品が見つかりません')
    expect(error.status).toBe(404)
  })

  it('レスポンスなし(ネットワークエラー)は汎用メッセージになる', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error.message).toBe('通信に失敗しました')
    expect(error.status).toBeUndefined()
  })

  it('通常の Error はメッセージを引き継ぐ', () => {
    const error = toApiError(new Error('boom'))
    expect(error.message).toBe('boom')
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`@/shared/api/apiError` が存在しない)

- [ ] **Step 3: apiError / mutator / orval 設定を実装**

`src/shared/api/apiError.ts`:

```ts
import { isAxiosError } from 'axios'

/** HTTP エラーを正規化した型。呼び出し側は axios の内部構造を知らなくてよい。 */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number, cause?: unknown) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
  }
}

/** ErrorResponse(openapi/api.yaml 定義)の message を取り出す */
function extractMessage(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message: unknown }).message
    if (typeof message === 'string') return message
  }
  return undefined
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (isAxiosError(error)) {
    if (error.response) {
      const message = extractMessage(error.response.data) ?? '通信に失敗しました'
      return new ApiError(message, error.response.status, error)
    }
    return new ApiError('通信に失敗しました', undefined, error)
  }
  if (error instanceof Error) return new ApiError(error.message, undefined, error)
  return new ApiError('予期しないエラーが発生しました', undefined, error)
}
```

`src/shared/api/mutator.ts`:

```ts
import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { toApiError } from '@/shared/api/apiError'

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

// 将来の認証トークン差し込み口(現状はそのまま通す)
axiosInstance.interceptors.request.use((config) => config)

// エラーを ApiError に正規化して reject
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
)

// Orval axios クライアントが呼ぶシグネチャ:
//   customAxiosInstance<T>(config, options?) → Promise<T>
// レスポンスボディ (response.data) だけを返す
export const customAxiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  return axiosInstance({ ...config, ...options }).then((res) => res.data)
}
```

`orval.config.ts`:

```ts
import { defineConfig } from 'orval'

export default defineConfig({
  // ① vue-query composable + TS 型
  api: {
    input: './openapi/api.yaml',
    output: {
      target: './src/shared/api/generated/endpoints.ts',
      schemas: './src/shared/api/generated/model',
      client: 'vue-query',
      // httpClient を省略すると fetch 用のラップ型が生成され mutator と非互換になるため必須
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/shared/api/mutator.ts',
          name: 'customAxiosInstance',
        },
      },
    },
  },
  // ② zod スキーマ(実行時バリデーション用)
  apiZod: {
    input: './openapi/api.yaml',
    output: {
      target: './src/shared/api/generated/schemas.zod.ts',
      client: 'zod',
    },
  },
})
```

- [ ] **Step 4: 生成と検証**

```powershell
npm run test:run
npm run orval
npm run type-check
```

Expected: テスト PASS、orval が `src/shared/api/generated/endpoints.ts` / `model/` / `schemas.zod.ts` を生成、type-check exit 0。

- [ ] **Step 5: 生成された識別子の実名を確認して記録**

```powershell
Select-String -Path src/shared/api/generated/endpoints.ts -Pattern '^export (const|function|type)' | Select-Object -First 40
Select-String -Path src/shared/api/generated/schemas.zod.ts -Pattern '^export const' | Select-Object -First 20
```

Expected: `useListProducts` / `useGetProduct` / `useCreateStockMovement` / `getListProductsQueryKey` 等、および zod の `listProductsResponse`(命名が異なる場合はメモし、Task 9 でその実名を使う)。

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: orval 設定と axios mutator / ApiError を追加、APIコードを生成"
```

---

### Task 5: useNotify + AppSnackbar

**Files:**
- Create: `src/shared/composables/useNotify.ts`, `src/shared/components/AppSnackbar.vue`
- Test: `src/shared/composables/__tests__/useNotify.test.ts`

**Interfaces:**
- Produces: `useNotify(): { state: { visible, color, message }, notify(color: 'success'|'error'|'info', message: string): void }`(モジュールスコープ単一状態)。`AppSnackbar` は App.vue に1個置く表示部品

- [ ] **Step 1: 失敗するテストを書く**

`src/shared/composables/__tests__/useNotify.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { useNotify } from '@/shared/composables/useNotify'

describe('useNotify', () => {
  beforeEach(() => {
    const { state } = useNotify()
    state.visible = false
    state.message = ''
  })

  it('notify で表示状態とメッセージが設定される', () => {
    const { state, notify } = useNotify()
    notify('error', '通信に失敗しました')
    expect(state.visible).toBe(true)
    expect(state.color).toBe('error')
    expect(state.message).toBe('通信に失敗しました')
  })

  it('連続呼び出しは後勝ちで上書きされる', () => {
    const { state, notify } = useNotify()
    notify('error', '1件目')
    notify('success', '2件目')
    expect(state.color).toBe('success')
    expect(state.message).toBe('2件目')
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`useNotify` 未定義)

- [ ] **Step 3: 実装**

`src/shared/composables/useNotify.ts`:

```ts
import { reactive } from 'vue'

export type NotifyColor = 'success' | 'error' | 'info'

// アプリ全体で1つのスナックバー状態を共有する(モジュールスコープ)
const state = reactive({
  visible: false,
  color: 'info' as NotifyColor,
  message: '',
})

export function useNotify() {
  const notify = (color: NotifyColor, message: string) => {
    state.color = color
    state.message = message
    state.visible = true
  }
  return { state, notify }
}
```

`src/shared/components/AppSnackbar.vue`:

```vue
<script setup lang="ts">
import { useNotify } from '@/shared/composables/useNotify'

const { state } = useNotify()
</script>

<template>
  <v-snackbar v-model="state.visible" :color="state.color" :timeout="3000" location="top">
    {{ state.message }}
  </v-snackbar>
</template>
```

- [ ] **Step 4: テスト PASS を確認して Commit**

```powershell
npm run test:run
```

Expected: PASS

```powershell
git add -A
git commit -m "feat: グローバル通知(useNotify + AppSnackbar)を追加"
```

---

### Task 6: vue-query / Pinia / Router の配線

**Files:**
- Create: `src/app/plugins/query.ts`, `src/app/plugins/pinia.ts`, `src/app/router/index.ts`
- Test: `src/app/plugins/__tests__/query.test.ts`
- Modify: `src/app/main.ts`, `src/app/App.vue`

**Interfaces:**
- Consumes: `ApiError`(Task 4)、`useNotify`(Task 5)
- Produces:
  - `createAppQueryClient(): QueryClient` と `registerVueQuery(app: App)`(`@/app/plugins/query`)
  - `default export` の pinia(persistedstate 適用済み)、router(hash history)。ルートは Task 10 で追加

- [ ] **Step 1: 失敗するテストを書く**

`src/app/plugins/__tests__/query.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createAppQueryClient } from '@/app/plugins/query'
import { useNotify } from '@/shared/composables/useNotify'
import { ApiError } from '@/shared/api/apiError'

describe('createAppQueryClient', () => {
  it('クエリ方針(staleTime / retry / refetchOnWindowFocus)が設定されている', () => {
    const client = createAppQueryClient()
    const defaults = client.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(30 * 1000)
    expect(defaults.queries?.retry).toBe(1)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false)
  })

  it('クエリエラーで useNotify に ApiError のメッセージが流れる', () => {
    const client = createAppQueryClient()
    const { state } = useNotify()
    state.visible = false
    client
      .getQueryCache()
      .config.onError?.(new ApiError('サーバーエラー', 500), {} as never)
    expect(state.visible).toBe(true)
    expect(state.message).toBe('サーバーエラー')
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`@/app/plugins/query` が存在しない)

- [ ] **Step 3: 実装**

`src/app/plugins/query.ts`:

```ts
import { MutationCache, QueryCache, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { App } from 'vue'
import { ApiError } from '@/shared/api/apiError'
import { useNotify } from '@/shared/composables/useNotify'

/** アプリ全体のクエリ方針を一箇所で定義する(スペック §10) */
export function createAppQueryClient(): QueryClient {
  const { notify } = useNotify()
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : 'データの取得に失敗しました'
        notify('error', message)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        const message = error instanceof ApiError ? error.message : '処理に失敗しました'
        notify('error', message)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30秒: 戻る遷移での再フェッチを抑制しつつ在庫の鮮度を保つ
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

export function registerVueQuery(app: App) {
  app.use(VueQueryPlugin, { queryClient: createAppQueryClient() })
}
```

`src/app/plugins/pinia.ts`:

```ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// persist: true を付けた store は端末保存される(スペック §7.5 作業中データの保険)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export default pinia
```

`src/app/router/index.ts`:

```ts
import { createRouter, createWebHashHistory } from 'vue-router'

// hash history: Capacitor WebView(file/https ローカル配信)でサーバー側リライト不要のため
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // 機能ルートは各 feature 追加時にここへ登録する(Task 10 で products を追加)
  ],
})

export default router
```

`src/app/main.ts`:

```ts
import { createApp } from 'vue'
import App from '@/app/App.vue'
import pinia from '@/app/plugins/pinia'
import { registerVueQuery } from '@/app/plugins/query'
import vuetify from '@/app/plugins/vuetify'
import router from '@/app/router'

const app = createApp(App)
app.use(vuetify)
app.use(pinia)
app.use(router)
registerVueQuery(app)
app.mount('#app')
```

`src/app/App.vue`:

```vue
<script setup lang="ts">
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
</script>

<template>
  <v-app>
    <router-view />
    <AppSnackbar />
  </v-app>
</template>
```

- [ ] **Step 4: テスト PASS・ビルド確認・Commit**

```powershell
npm run test:run
npm run build
```

Expected: すべて exit 0

```powershell
git add -A
git commit -m "feat: vue-query / Pinia(persistedstate) / Router を配線"
```

---

### Task 7: MainLayout

**Files:**
- Create: `src/shared/components/layout/MainLayout.vue`
- Test: `src/shared/components/layout/__tests__/MainLayout.test.ts`

**Interfaces:**
- Produces: `MainLayout` — props `{ title: string; showBack?: boolean }`、slot `default`(v-main 内)と `#footer`(下部固定のアクション領域)。全ページがこれを使う(スペック §6.2)

- [ ] **Step 1: 失敗するテストを書く**

`src/shared/components/layout/__tests__/MainLayout.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import vuetify from '@/app/plugins/vuetify'
import MainLayout from '@/shared/components/layout/MainLayout.vue'

function mountLayout(showBack = false) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
  const Host = defineComponent({
    components: { MainLayout },
    data: () => ({ showBack }),
    template: `
      <v-app>
        <MainLayout title="テスト画面" :show-back="showBack">
          <p>MAIN-CONTENT</p>
          <template #footer><p>FOOTER-CONTENT</p></template>
        </MainLayout>
      </v-app>`,
  })
  return mount(Host, { global: { plugins: [vuetify, router] } })
}

describe('MainLayout', () => {
  it('タイトル・main slot・footer slot が描画される', () => {
    const wrapper = mountLayout()
    expect(wrapper.text()).toContain('テスト画面')
    expect(wrapper.text()).toContain('MAIN-CONTENT')
    expect(wrapper.text()).toContain('FOOTER-CONTENT')
  })

  it('show-back 指定時のみ戻るボタンが表示される', () => {
    expect(mountLayout(false).find('[data-testid="back-button"]').exists()).toBe(false)
    expect(mountLayout(true).find('[data-testid="back-button"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`MainLayout.vue` が存在しない)

- [ ] **Step 3: 実装**

`src/shared/components/layout/MainLayout.vue`:

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  title: string
  showBack?: boolean
}>()

const router = useRouter()
const back = () => router.back()
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <template v-if="showBack" #prepend>
      <v-btn data-testid="back-button" icon="mdi-arrow-left" @click="back" />
    </template>
    <v-app-bar-title>{{ title }}</v-app-bar-title>
  </v-app-bar>

  <v-main>
    <slot />
  </v-main>

  <v-footer v-if="$slots.footer" app class="pa-3">
    <div class="w-100">
      <slot name="footer" />
    </div>
  </v-footer>
</template>
```

- [ ] **Step 4: テスト PASS を確認して Commit**

```powershell
npm run test:run
```

Expected: PASS

```powershell
git add -A
git commit -m "feat: MainLayout(header=props / main・footer=slot)を追加"
```

---

### Task 8: グローバルローディング

**Files:**
- Create: `src/shared/composables/useGlobalLoading.ts`, `src/shared/components/layout/AppLoadingOverlay.vue`
- Test: `src/shared/composables/__tests__/useGlobalLoading.test.ts`
- Modify: `src/app/router/index.ts`, `src/app/App.vue`

**Interfaces:**
- Produces: `useGlobalLoading(): { isLoading: ComputedRef<boolean> }`(コンポーネント setup 内でのみ呼べる)、`setNavigating(value: boolean)`(router フックから呼ぶモジュール関数)

- [ ] **Step 1: 失敗するテストを書く**

`src/shared/composables/__tests__/useGlobalLoading.test.ts`:

```ts
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { setNavigating, useGlobalLoading } from '@/shared/composables/useGlobalLoading'

function mountHost() {
  let captured!: ReturnType<typeof useGlobalLoading>
  const Host = defineComponent({
    setup() {
      captured = useGlobalLoading()
      return () => h('div')
    },
  })
  const wrapper = mount(Host, {
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
  })
  return { wrapper, loading: captured }
}

describe('useGlobalLoading', () => {
  afterEach(() => setNavigating(false))

  it('初期状態は非表示', () => {
    const { loading } = mountHost()
    expect(loading.isLoading.value).toBe(false)
  })

  it('画面遷移中は表示になり、終了で消える', () => {
    const { loading } = mountHost()
    setNavigating(true)
    expect(loading.isLoading.value).toBe(true)
    setNavigating(false)
    expect(loading.isLoading.value).toBe(false)
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`useGlobalLoading` 未定義)

- [ ] **Step 3: 実装**

`src/shared/composables/useGlobalLoading.ts`:

```ts
import { computed, ref } from 'vue'
import { useIsFetching, useIsMutating } from '@tanstack/vue-query'

// ルーター遷移中フラグ(アプリ全体で1つ)
const isNavigating = ref(false)

/** router のナビゲーションガードから呼ぶ */
export function setNavigating(value: boolean) {
  isNavigating.value = value
}

/**
 * グローバルローディングの表示判定(スペック §7)。
 * バックグラウンド再取得(キャッシュ表示中の裏取得)ではスピナーを出さないため、
 * キャッシュ未保持(= 初回取得)のクエリのみを数える。ミューテーションは常に対象。
 */
export function useGlobalLoading() {
  const initialFetchCount = useIsFetching({
    predicate: (query) => query.state.data === undefined,
  })
  const mutationCount = useIsMutating()
  const isLoading = computed(
    () => isNavigating.value || initialFetchCount.value > 0 || mutationCount.value > 0,
  )
  return { isLoading }
}
```

`src/shared/components/layout/AppLoadingOverlay.vue`:

```vue
<script setup lang="ts">
import { useGlobalLoading } from '@/shared/composables/useGlobalLoading'

const { isLoading } = useGlobalLoading()
</script>

<template>
  <v-overlay
    :model-value="isLoading"
    persistent
    no-click-animation
    class="align-center justify-center"
    :z-index="2000"
  >
    <v-progress-circular indeterminate size="48" color="primary" />
  </v-overlay>
</template>
```

`src/app/router/index.ts` に追記(export default の前):

```ts
import { setNavigating } from '@/shared/composables/useGlobalLoading'

router.beforeEach(() => {
  setNavigating(true)
})
router.afterEach(() => {
  setNavigating(false)
})
router.onError(() => {
  setNavigating(false)
})
```

`src/app/App.vue`:

```vue
<script setup lang="ts">
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import AppLoadingOverlay from '@/shared/components/layout/AppLoadingOverlay.vue'
</script>

<template>
  <v-app>
    <router-view />
    <AppSnackbar />
    <AppLoadingOverlay />
  </v-app>
</template>
```

- [ ] **Step 4: テスト PASS を確認して Commit**

```powershell
npm run test:run
npm run type-check
```

Expected: PASS / exit 0

```powershell
git add -A
git commit -m "feat: グローバルローディング(遷移 + 初回取得 + ミューテーション)を追加"
```

---

### Task 9: products feature — 型・zodバリデーション・composables

**Files:**
- Create: `src/features/products/types.ts`, `src/shared/api/validated.ts`, `src/features/products/composables/useProductSearchPage.ts`, `src/features/products/composables/useProductListPage.ts`, `src/features/products/composables/useProductDetailPage.ts`
- Test: `src/features/products/__tests__/useProductSearchPage.test.ts`

**Interfaces:**
- Consumes: 生成フック `useListProducts` / `useGetProduct` / `useCreateStockMovement`、zod `listProductsResponse`(Task 4 Step 5 で確認した実名を使う)、`useNotify`(Task 5)
- Produces:
  - `useProductSearchPage(): { condition: { code, keyword }, canSearch: ComputedRef<boolean>, goToList(): void }`
  - `useProductListPage(): { products: Ref<Product[] | undefined>, goToDetail(id: string): void }`
  - `useProductDetailPage(): { product, form: { type, quantity, note }, canSubmit, isPending, submit(): void }`
  - `parseOrNotify<T>(schema, data): T`(`@/shared/api/validated`)

- [ ] **Step 1: 失敗するテストを書く**

`src/features/products/__tests__/useProductSearchPage.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { useProductSearchPage } from '@/features/products/composables/useProductSearchPage'

function mountComposable() {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/products', component: { template: '<div />' } },
    ],
  })
  let captured!: ReturnType<typeof useProductSearchPage>
  const Host = defineComponent({
    setup() {
      captured = useProductSearchPage()
      return () => h('div')
    },
  })
  mount(Host, { global: { plugins: [router] } })
  return { page: captured, router }
}

describe('useProductSearchPage', () => {
  it('条件が空のうちは検索できない', () => {
    const { page } = mountComposable()
    expect(page.canSearch.value).toBe(false)
  })

  it('キーワード入力で検索可能になり、空白は除去して一覧へ遷移する', async () => {
    const { page, router } = mountComposable()
    page.condition.keyword = ' ボルト '
    expect(page.canSearch.value).toBe(true)
    page.goToList()
    await router.isReady()
    await new Promise((r) => setTimeout(r))
    expect(router.currentRoute.value.path).toBe('/products')
    expect(router.currentRoute.value.query).toEqual({ keyword: 'ボルト' })
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(composable 未定義)

- [ ] **Step 3: 実装**

`src/features/products/types.ts`:

```ts
// 画面表示用の型のみを置く。API の型は orval 生成物(@/shared/api/generated)を使い手書きしない
export interface ProductSearchCondition {
  code: string
  keyword: string
}
```

`src/shared/api/validated.ts`:

```ts
import type { z } from 'zod'
import { useNotify } from '@/shared/composables/useNotify'

/**
 * API レスポンスの実行時バリデーション(スペック §10)。
 * 失敗 = API 契約違反。開発時は console.error で気づけるようにし、
 * 画面は落とさずデータをそのまま返す(フェイルソフト)。
 */
export function parseOrNotify<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (import.meta.env.DEV) console.error('API契約違反:', result.error)
    useNotify().notify('error', 'サーバー応答が想定と異なります')
    return data as z.infer<T>
  }
  return result.data
}
```

`src/features/products/composables/useProductSearchPage.ts`:

```ts
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { ProductSearchCondition } from '../types'

/** 商品検索ページ: 条件を組み立てて一覧へ遷移するだけ(API は叩かない。スペック §6.1) */
export function useProductSearchPage() {
  const router = useRouter()
  const condition = reactive<ProductSearchCondition>({ code: '', keyword: '' })

  const canSearch = computed(() => !!(condition.code.trim() || condition.keyword.trim()))

  const goToList = () => {
    if (!canSearch.value) return
    const query: Record<string, string> = {}
    if (condition.code.trim()) query.code = condition.code.trim()
    if (condition.keyword.trim()) query.keyword = condition.keyword.trim()
    router.push({ path: '/products', query })
  }

  return { condition, canSearch, goToList }
}
```

`src/features/products/composables/useProductListPage.ts`:

```ts
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListProducts } from '@/shared/api/generated/endpoints'
import { listProductsResponse } from '@/shared/api/generated/schemas.zod'
import { parseOrNotify } from '@/shared/api/validated'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** 一覧ページ: 検索条件は URL クエリが唯一の情報源。queryKey に自動反映される(スペック §6.1) */
export function useProductListPage() {
  const route = useRoute()
  const router = useRouter()

  // computed を渡すことで route.query の変化が queryKey の変化 = 再取得になる
  const params = computed(() => ({
    code: asString(route.query.code),
    keyword: asString(route.query.keyword),
  }))

  const { data } = useListProducts(params, {
    query: {
      select: (response) => parseOrNotify(listProductsResponse, response),
    },
  })

  const products = computed(() => data.value)
  const goToDetail = (id: string) => router.push(`/products/${id}`)

  return { products, goToDetail }
}
```

`src/features/products/composables/useProductDetailPage.ts`:

```ts
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useCreateStockMovement, useGetProduct } from '@/shared/api/generated/endpoints'
import type { StockMovementRequest } from '@/shared/api/generated/model'
import { useNotify } from '@/shared/composables/useNotify'

/** 詳細ページ: 商品表示 + 入庫/出庫/現品調査の登録(スペック §5) */
export function useProductDetailPage() {
  const route = useRoute()
  const queryClient = useQueryClient()
  const { notify } = useNotify()

  const id = computed(() => String(route.params.id))
  const { data: product } = useGetProduct(id)

  const form = reactive({
    type: 'IN' as StockMovementRequest['type'],
    quantity: 1,
    note: '',
  })

  const canSubmit = computed(() => Number.isInteger(form.quantity) && form.quantity >= 0)

  const { mutate, isPending } = useCreateStockMovement({
    mutation: {
      onSuccess: async () => {
        // 一覧・詳細のキャッシュをまとめて無効化して最新在庫を取り直す
        await queryClient.invalidateQueries({
          predicate: (query) => String(query.queryKey[0]).startsWith('/products'),
        })
        notify('success', '登録しました')
      },
    },
  })

  const submit = () => {
    if (!canSubmit.value) return
    mutate({
      data: {
        productId: id.value,
        type: form.type,
        quantity: form.quantity,
        note: form.note.trim() || undefined,
      },
    })
  }

  return { product, form, canSubmit, isPending, submit }
}
```

注意: `useListProducts` / `listProductsResponse` / `StockMovementRequest` の実名が Task 4 Step 5 の確認結果と異なる場合は、**生成物の実名に合わせて import を修正**する(例: zod 側が `listProductsResponseItem` の配列形式で出る場合は `z.array(...)` で包むのではなく、生成された一覧用スキーマをそのまま使う)。

- [ ] **Step 4: テスト PASS・型チェックを確認して Commit**

```powershell
npm run test:run
npm run type-check
```

Expected: PASS / exit 0

```powershell
git add -A
git commit -m "feat: products の composables(検索・一覧・詳細/登録)と zod バリデーションを追加"
```

---

### Task 10: products 3ページ + ルート登録

**Files:**
- Create: `src/features/products/pages/ProductSearchPage.vue`, `src/features/products/pages/ProductListPage.vue`, `src/features/products/pages/ProductDetailPage.vue`, `src/features/products/components/ProductSearchForm.vue`, `src/features/products/components/StockMovementForm.vue`
- Test: `src/features/products/__tests__/ProductSearchForm.test.ts`
- Modify: `src/app/router/index.ts`

**Interfaces:**
- Consumes: `MainLayout`(Task 7)、Task 9 の composables
- Produces: ルート `/products/search`, `/products`, `/products/:id`。`/` は `/products/search` へリダイレクト

- [ ] **Step 1: 失敗するテストを書く**

`src/features/products/__tests__/ProductSearchForm.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import vuetify from '@/app/plugins/vuetify'
import ProductSearchForm from '@/features/products/components/ProductSearchForm.vue'

describe('ProductSearchForm', () => {
  it('入力が v-model(code / keyword)に反映される', async () => {
    const wrapper = mount(ProductSearchForm, {
      props: {
        code: '',
        keyword: '',
        'onUpdate:code': (v: string) => wrapper.setProps({ code: v }),
        'onUpdate:keyword': (v: string) => wrapper.setProps({ keyword: v }),
      },
      global: { plugins: [vuetify] },
    })
    await wrapper.find('[data-testid="code-input"] input').setValue('4901234567894')
    await wrapper.find('[data-testid="keyword-input"] input').setValue('ボルト')
    expect(wrapper.props('code')).toBe('4901234567894')
    expect(wrapper.props('keyword')).toBe('ボルト')
  })

  it('Enter で submit イベントが発火する', async () => {
    const wrapper = mount(ProductSearchForm, {
      props: { code: '', keyword: '' },
      global: { plugins: [vuetify] },
    })
    await wrapper.find('[data-testid="keyword-input"] input').trigger('keyup.enter')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`ProductSearchForm.vue` が存在しない)

- [ ] **Step 3: コンポーネントとページを実装**

`src/features/products/components/ProductSearchForm.vue`:

```vue
<script setup lang="ts">
const code = defineModel<string>('code', { default: '' })
const keyword = defineModel<string>('keyword', { default: '' })

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <v-text-field
      v-model="code"
      data-testid="code-input"
      label="商品コード"
      clearable
      hide-details
      @keyup.enter="emit('submit')"
    />
    <v-text-field
      v-model="keyword"
      data-testid="keyword-input"
      label="品名キーワード"
      clearable
      hide-details
      @keyup.enter="emit('submit')"
    />
  </div>
</template>
```

`src/features/products/components/StockMovementForm.vue`:

```vue
<script setup lang="ts">
import type { StockMovementRequest } from '@/shared/api/generated/model'

const type = defineModel<StockMovementRequest['type']>('type', { required: true })
const quantity = defineModel<number>('quantity', { required: true })
const note = defineModel<string>('note', { default: '' })

const typeItems = [
  { title: '入庫', value: 'IN' },
  { title: '出庫', value: 'OUT' },
  { title: '現品調査(実数)', value: 'ADJUST' },
]
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <v-select v-model="type" :items="typeItems" label="区分" hide-details />
    <v-text-field
      v-model.number="quantity"
      type="number"
      label="数量"
      min="0"
      hide-details
    />
    <v-text-field v-model="note" label="メモ(任意)" hide-details />
  </div>
</template>
```

`src/features/products/pages/ProductSearchPage.vue`:

```vue
<script setup lang="ts">
import MainLayout from '@/shared/components/layout/MainLayout.vue'
import ProductSearchForm from '../components/ProductSearchForm.vue'
import { useProductSearchPage } from '../composables/useProductSearchPage'

const { condition, canSearch, goToList } = useProductSearchPage()
</script>

<template>
  <MainLayout title="商品検索">
    <v-container>
      <ProductSearchForm
        v-model:code="condition.code"
        v-model:keyword="condition.keyword"
        @submit="goToList"
      />
    </v-container>
    <template #footer>
      <v-btn block color="primary" size="large" :disabled="!canSearch" @click="goToList">
        検索
      </v-btn>
    </template>
  </MainLayout>
</template>
```

`src/features/products/pages/ProductListPage.vue`:

```vue
<script setup lang="ts">
import MainLayout from '@/shared/components/layout/MainLayout.vue'
import { useProductListPage } from '../composables/useProductListPage'

const { products, goToDetail } = useProductListPage()
</script>

<template>
  <MainLayout title="検索結果" show-back>
    <v-list v-if="products && products.length > 0" lines="two">
      <v-list-item
        v-for="product in products"
        :key="product.id"
        :title="product.name"
        :subtitle="`${product.code} / 棚 ${product.location} / 在庫 ${product.stock}`"
        @click="goToDetail(product.id)"
      />
    </v-list>
    <v-empty-state
      v-else-if="products"
      icon="mdi-magnify"
      title="該当する商品がありません"
      text="条件を変えて再検索してください"
    />
  </MainLayout>
</template>
```

`src/features/products/pages/ProductDetailPage.vue`:

```vue
<script setup lang="ts">
import MainLayout from '@/shared/components/layout/MainLayout.vue'
import StockMovementForm from '../components/StockMovementForm.vue'
import { useProductDetailPage } from '../composables/useProductDetailPage'

const { product, form, canSubmit, isPending, submit } = useProductDetailPage()
</script>

<template>
  <MainLayout title="商品詳細" show-back>
    <v-container v-if="product">
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-h6">{{ product.name }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-1 text-body-2">
            <div>コード: {{ product.code }}</div>
            <div>棚番: {{ product.location }}</div>
            <div>在庫数: {{ product.stock }}</div>
          </div>
        </v-card-text>
      </v-card>
      <StockMovementForm
        v-model:type="form.type"
        v-model:quantity="form.quantity"
        v-model:note="form.note"
      />
    </v-container>
    <template #footer>
      <v-btn
        block
        color="primary"
        size="large"
        :disabled="!canSubmit || isPending"
        @click="submit"
      >
        登録
      </v-btn>
    </template>
  </MainLayout>
</template>
```

`src/app/router/index.ts` の routes を置き換え:

```ts
routes: [
  { path: '/', redirect: '/products/search' },
  {
    path: '/products/search',
    component: () => import('@/features/products/pages/ProductSearchPage.vue'),
  },
  {
    path: '/products',
    component: () => import('@/features/products/pages/ProductListPage.vue'),
  },
  {
    path: '/products/:id',
    component: () => import('@/features/products/pages/ProductDetailPage.vue'),
  },
],
```

- [ ] **Step 4: テスト・型チェック**

```powershell
npm run test:run
npm run type-check
npm run build
```

Expected: すべて exit 0

- [ ] **Step 5: ブラウザで手動疎通**

```powershell
npm run dev:mock
```

ブラウザで `http://localhost:3000` を開き、次を確認:
1. `/#/products/search` にリダイレクトされ検索画面が出る
2. キーワードに「ボルト」を入れ「検索」→ 一覧に「ボルト M6」「ナット M6」(Prism の example)
3. 行タップ → 詳細に在庫数 120 が表示
4. 「登録」タップ → スナックバー「登録しました」
5. 戻るで一覧に即時復帰(スピナーなし = キャッシュヒット)

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: products 3ページ(検索・一覧・詳細/登録)とルートを追加"
```

---

### Task 11: オフライン検知(Network + onlineManager + オーバーレイ)

**Files:**
- Create: `src/shared/composables/useNetworkStatus.ts`, `src/shared/components/layout/AppOfflineOverlay.vue`
- Test: `src/shared/composables/__tests__/useNetworkStatus.test.ts`
- Modify: `src/app/main.ts`, `src/app/App.vue`

**Interfaces:**
- Consumes: `axiosInstance`(Task 4)
- Produces: `initNetworkWatch(): Promise<void>`(main.ts で1回呼ぶ)、`useNetworkStatus(): { isOffline, offlineSince, retry }`。テスト用に `_applyConnectedForTest` / `_resetForTest` を export

- [ ] **Step 1: 失敗するテストを書く**

`src/shared/composables/__tests__/useNetworkStatus.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager } from '@tanstack/vue-query'
import {
  _applyConnectedForTest,
  _resetForTest,
  useNetworkStatus,
} from '@/shared/composables/useNetworkStatus'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetForTest()
  })
  afterEach(() => {
    vi.useRealTimers()
    onlineManager.setOnline(true)
  })

  it('切断直後(瞬断)ではオフライン表示にならない', () => {
    const { isOffline } = useNetworkStatus()
    _applyConnectedForTest(false)
    expect(isOffline.value).toBe(false)
    vi.advanceTimersByTime(1000)
    _applyConnectedForTest(true) // 瞬断から復帰
    vi.advanceTimersByTime(5000)
    expect(isOffline.value).toBe(false)
  })

  it('切断が続くとオフライン表示になり、復帰で消える', () => {
    const { isOffline } = useNetworkStatus()
    _applyConnectedForTest(false)
    vi.advanceTimersByTime(3000)
    expect(isOffline.value).toBe(true)
    _applyConnectedForTest(true)
    expect(isOffline.value).toBe(false)
  })

  it('vue-query の onlineManager に接続状態が伝播する', () => {
    _applyConnectedForTest(false)
    expect(onlineManager.isOnline()).toBe(false)
    _applyConnectedForTest(true)
    expect(onlineManager.isOnline()).toBe(true)
  })
})
```

- [ ] **Step 2: テスト実行で失敗を確認**

```powershell
npm run test:run
```

Expected: FAIL(`useNetworkStatus` 未定義)

- [ ] **Step 3: 実装**

`src/shared/composables/useNetworkStatus.ts`:

```ts
import { computed, ref } from 'vue'
import { Network } from '@capacitor/network'
import { onlineManager } from '@tanstack/vue-query'
import { axiosInstance } from '@/shared/api/mutator'

// 瞬断(棚の陰など)でオーバーレイを出さないための猶予
const OFFLINE_DELAY_MS = 2500

const isOffline = ref(false)
const offlineSince = ref<number | null>(null)
let offlineTimer: ReturnType<typeof setTimeout> | undefined

function applyConnected(connected: boolean) {
  // vue-query に伝播: オフライン中はクエリ/ミューテーションを一時停止、復帰で自動再開
  onlineManager.setOnline(connected)
  clearTimeout(offlineTimer)
  if (connected) {
    isOffline.value = false
    offlineSince.value = null
  } else {
    offlineTimer = setTimeout(() => {
      isOffline.value = true
      offlineSince.value = Date.now()
    }, OFFLINE_DELAY_MS)
  }
}

/**
 * アプリ起動時に1回だけ呼ぶ(スペック §7.5)。
 * @capacitor/network は Web 実装(navigator.onLine ベース)を持つためブラウザ開発でも動く。
 * VITE_DISABLE_OFFLINE_OVERLAY=true で検知層ごと無効化できる。
 */
export async function initNetworkWatch() {
  if (import.meta.env.VITE_DISABLE_OFFLINE_OVERLAY === 'true') return
  const status = await Network.getStatus()
  applyConnected(status.connected)
  await Network.addListener('networkStatusChange', (s) => applyConnected(s.connected))
}

export function useNetworkStatus() {
  /** 手動再試行: 接続表示に頼らず /health で実疎通を確認する */
  const retry = async () => {
    try {
      await axiosInstance.get('/health')
      applyConnected(true)
    } catch {
      // 依然オフライン。表示は変えない(ユーザーは再度押せる)
    }
  }
  return {
    isOffline: computed(() => isOffline.value),
    offlineSince: computed(() => offlineSince.value),
    retry,
  }
}

// --- テスト専用 ---
export function _applyConnectedForTest(connected: boolean) {
  applyConnected(connected)
}
export function _resetForTest() {
  clearTimeout(offlineTimer)
  isOffline.value = false
  offlineSince.value = null
}
```

`src/shared/components/layout/AppOfflineOverlay.vue`:

```vue
<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { useNetworkStatus } from '@/shared/composables/useNetworkStatus'

const { isOffline, offlineSince, retry } = useNetworkStatus()

// 30秒復帰しなければ追加の案内を出す(スペック §7.5 エスカレーション)
const ESCALATION_MS = 30_000
const now = ref(Date.now())
const timer = setInterval(() => {
  now.value = Date.now()
}, 1000)
onScopeDispose(() => clearInterval(timer))

const showEscalation = computed(
  () => offlineSince.value !== null && now.value - offlineSince.value > ESCALATION_MS,
)
</script>

<template>
  <v-overlay
    :model-value="isOffline"
    persistent
    no-click-animation
    class="align-center justify-center"
    :z-index="3000"
  >
    <v-card class="pa-6 text-center" max-width="320">
      <v-icon icon="mdi-wifi-off" size="48" color="error" class="mb-2" />
      <div class="text-h6 mb-1">オフラインです</div>
      <div class="text-body-2 mb-4">再接続を待っています…</div>
      <v-btn color="primary" block @click="retry">再試行</v-btn>
      <template v-if="showEscalation">
        <v-divider class="my-4" />
        <div class="text-body-2">
          端末の Wi-Fi 設定を確認してください。復帰しない場合は管理者に連絡してください。
        </div>
      </template>
    </v-card>
  </v-overlay>
</template>
```

`src/app/main.ts` の末尾に追記:

```ts
import { initNetworkWatch } from '@/shared/composables/useNetworkStatus'

void initNetworkWatch()
```

`src/app/App.vue` に `AppOfflineOverlay` を追加:

```vue
<script setup lang="ts">
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import AppLoadingOverlay from '@/shared/components/layout/AppLoadingOverlay.vue'
import AppOfflineOverlay from '@/shared/components/layout/AppOfflineOverlay.vue'
</script>

<template>
  <v-app>
    <router-view />
    <AppSnackbar />
    <AppLoadingOverlay />
    <AppOfflineOverlay />
  </v-app>
</template>
```

- [ ] **Step 4: テスト・手動確認・Commit**

```powershell
npm run test:run
npm run type-check
```

Expected: PASS / exit 0

手動確認: `npm run dev:mock` → DevTools の Network タブで「Offline」に切替 → 約2.5秒後にオーバーレイ表示 → 「Online」に戻すと消える。

```powershell
git add -A
git commit -m "feat: オフライン検知(瞬断猶予・再試行・エスカレーション・onlineManager連携)を追加"
```

---

### Task 12: Playwright E2E

**Files:**
- Create: `playwright.config.ts`, `e2e/products.spec.ts`

**Interfaces:**
- Consumes: Prism の example(Task 3)、products 画面(Task 10)
- Produces: `npm run test:e2e` で Prism + Vite を自動起動して1本の E2E が通る

- [ ] **Step 1: 設定と失敗するテストを書く**

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5174',
    screenshot: 'on',
    trace: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        // ハンディ端末の設計サイズに合わせる
        viewport: { width: 360, height: 720 },
      },
    },
  ],
  webServer: [
    {
      command: 'npx @stoplight/prism-cli mock openapi/api.yaml --port 4010 --cors',
      url: 'http://localhost:4010/health',
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
})
```

`e2e/products.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('検索 → 一覧 → 詳細 → 在庫登録が一連で動作する', async ({ page }) => {
  // 検索(hash ルーティング)
  await page.goto('/#/products/search')
  await page.getByLabel('品名キーワード').fill('ボルト')
  await page.getByRole('button', { name: '検索' }).click()

  // 一覧: Prism の example が表示される
  await expect(page.getByText('ボルト M6')).toBeVisible()
  await expect(page.getByText('ナット M6')).toBeVisible()

  // 詳細
  await page.getByText('ボルト M6').click()
  await expect(page.getByText('在庫数: 120')).toBeVisible()

  // 在庫登録 → 成功スナックバー
  await page.getByRole('button', { name: '登録' }).click()
  await expect(page.getByText('登録しました')).toBeVisible()
})
```

- [ ] **Step 2: ブラウザバイナリの導入と実行**

```powershell
npx playwright install chromium
npm run test:e2e
```

Expected: 1 passed。失敗した場合は `npx playwright show-report` でスクリーンショットとトレースを確認して修正する(セレクタずれ・Prism 未起動が典型)。

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "test: Playwright E2E(検索→一覧→詳細→登録)を追加"
```

---

### Task 13: Capacitor 8 + Android プラットフォーム

**Files:**
- Create: `capacitor.config.ts`, `android/`(CLI 生成)、`docs/setup-android.md`
- Modify: `android/variables.gradle`(minSdkVersion)

**Interfaces:**
- Consumes: `dist/`(`npm run build:android` の成果物)
- Produces: `npx cap sync android` → `android/gradlew.bat assembleDebug` で APK が作れる状態

- [ ] **Step 1: capacitor.config.ts を書く**

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'jp.example.warehousescan',
  appName: 'WarehouseScan',
  webDir: 'dist',
}

export default config
```

- [ ] **Step 2: Android プラットフォーム追加と minSdk 設定**

```powershell
npm run build:android
npx cap add android
```

Expected: `android/` が生成される。

`android/variables.gradle` の `minSdkVersion` を `33` に変更する(スペック: Android 13 専用)。既定値の行を書き換える:

```groovy
minSdkVersion = 33
```

- [ ] **Step 3: セットアップ手順ドキュメントを書く**

`docs/setup-android.md`:

```markdown
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
```

- [ ] **Step 4: ビルド検証**

```powershell
npx cap sync android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
Set-Location android
.\gradlew.bat assembleDebug
Set-Location ..
Test-Path android/app/build/outputs/apk/debug/app-debug.apk
```

Expected: BUILD SUCCESSFUL、`Test-Path` が `True`。JAVA_HOME のパスが環境と異なる場合は実環境の Android Studio JBR パスに読み替える。

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: Capacitor8 Android プラットフォームを追加(minSdk 33)"
```

---

### Task 14: README + 最終検証

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: 全タスクの成果物

- [ ] **Step 1: README を書く**

`README.md`:

```markdown
# WarehouseScan (vue-vuetify4-capacitor8)

倉庫内作業(入庫・出庫・現品調査)向け Android ハイブリッドアプリの土台。
Android 13(API 33)専用 / PWA 非対応。

設計: `docs/superpowers/specs/2026-07-13-project-foundation-design.md`
Android セットアップ: `docs/setup-android.md`

## スタック

Vue 3 + Vuetify 4 + Vite / Capacitor 8 / orval(OpenAPI → vue-query + zod) / Pinia / Vitest / Playwright

## 開発

```powershell
npm install
npm run dev:mock   # Vite(3000) + Prism モック(4010)
```

## 主要コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev:mock` | 開発サーバー + Prism モック |
| `npm run orval` | openapi/api.yaml から API コード生成 |
| `npm run test:run` | ユニットテスト(Vitest) |
| `npm run test:e2e` | E2E(Playwright、モック自動起動) |
| `npm run android:sync` | Android 向けビルド + cap sync |
| `npm run lint` / `npm run type-check` | 静的チェック |

## 構造

- `src/app/` — 起動・配線(router / plugins)
- `src/features/<機能>/` — 1機能1フォルダ(pages / components / composables / stores / types)
- `src/shared/` — 機能横断(api / components / composables)。`shared/api/generated/` は orval 出力で手編集禁止

## 規約(抜粋)

- `.vue` は配線のみ。ロジックは composable(`.ts`)へ
- スタイルは Vuetify ユーティリティクラスと props で。`<style scoped>` 原則禁止
- 検索条件は URL クエリで持つ。サーバー状態は vue-query、クライアント状態のみ Pinia
```

- [ ] **Step 2: 全検証を実行**

```powershell
npm run lint
npm run type-check
npm run test:run
npm run test:e2e
npm run build
```

Expected: すべて exit 0。1つでも失敗したら修正してから次へ。

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "docs: README を追加、土台構築の最終検証"
```
