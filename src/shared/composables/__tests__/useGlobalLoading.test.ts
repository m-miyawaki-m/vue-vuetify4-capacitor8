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
