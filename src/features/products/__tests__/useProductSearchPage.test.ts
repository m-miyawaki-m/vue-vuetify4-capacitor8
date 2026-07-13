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
