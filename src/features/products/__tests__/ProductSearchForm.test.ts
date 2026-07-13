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
