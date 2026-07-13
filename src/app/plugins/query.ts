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
