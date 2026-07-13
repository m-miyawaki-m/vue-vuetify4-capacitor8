import { beforeEach, describe, expect, it } from 'vitest'
import { useNotify } from '@/shared/composables/useNotify'

describe('useNotify', () => {
  beforeEach(() => {
    const { state } = useNotify()
    state.visible = false
    state.message = ''
  })

  it('notify で表示状態とメッセージが設定される', () => {
    const { state, notify } = useNotify()
    notify('error', '通信に失敗しました')
    expect(state.visible).toBe(true)
    expect(state.color).toBe('error')
    expect(state.message).toBe('通信に失敗しました')
  })

  it('連続呼び出しは後勝ちで上書きされる', () => {
    const { state, notify } = useNotify()
    notify('error', '1件目')
    notify('success', '2件目')
    expect(state.color).toBe('success')
    expect(state.message).toBe('2件目')
  })
})
