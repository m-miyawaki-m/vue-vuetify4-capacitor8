import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { VApp, VBtn } from 'vuetify/components'
import vuetify from '@/app/plugins/vuetify'

describe('Vuetify セットアップ', () => {
  it('v-app 配下で Vuetify コンポーネントが描画できる', () => {
    const Host = defineComponent({
      components: { VApp, VBtn },
      template: '<v-app><v-btn>OK</v-btn></v-app>',
    })
    const wrapper = mount(Host, { global: { plugins: [vuetify] } })
    const btn = wrapper.find('.v-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('OK')
  })
})
