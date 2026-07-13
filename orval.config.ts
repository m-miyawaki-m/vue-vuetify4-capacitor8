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
