import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setNavigating, useGlobalLoading } from '@/shared/composables/useGlobalLoading'

function mountHost(queryClient: QueryClient = new QueryClient()) {
  let captured!: ReturnType<typeof useGlobalLoading>
  const Host = defineComponent({
    setup() {
      captured = useGlobalLoading()
      return () => h('div')
    },
  })
  const wrapper = mount(Host, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
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

  it('キャッシュ済みクエリの再取得ではローディングにならず、初回取得ではなる', async () => {
    const queryClient = new QueryClient()
    const { loading } = mountHost(queryClient)

    // 既にキャッシュがあるクエリを裏で再取得しても、state.data は取得中も定義されたままなので
    // isLoading は false のまま(スペック §7)
    queryClient.setQueryData(['cached'], 'data')
    const cachedFetch = queryClient.prefetchQuery({
      queryKey: ['cached'],
      queryFn: () => new Promise(() => {}),
    })
    void cachedFetch.catch(() => {})

    await vi.waitFor(() => {
      expect(queryClient.getQueryState(['cached'])?.fetchStatus).toBe('fetching')
    })
    expect(loading.isLoading.value).toBe(false)

    // キャッシュを持たないクエリの初回取得は isLoading を true にする
    const freshFetch = queryClient.prefetchQuery({
      queryKey: ['fresh'],
      queryFn: () => new Promise(() => {}),
    })
    void freshFetch.catch(() => {})

    await vi.waitFor(() => {
      expect(loading.isLoading.value).toBe(true)
    })

    queryClient.clear()
  })
})
