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
