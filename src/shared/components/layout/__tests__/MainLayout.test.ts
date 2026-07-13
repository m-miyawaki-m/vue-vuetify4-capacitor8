import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { VApp } from 'vuetify/components'
import vuetify from '@/app/plugins/vuetify'
import MainLayout from '@/shared/components/layout/MainLayout.vue'

function mountLayout(showBack = false) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
  const Host = defineComponent({
    components: { MainLayout, VApp },
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
