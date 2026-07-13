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
    client.getQueryCache().config.onError?.(new ApiError('サーバーエラー', 500), {} as never)
    expect(state.visible).toBe(true)
    expect(state.message).toBe('サーバーエラー')
  })
})
