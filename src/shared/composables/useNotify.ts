import { reactive } from 'vue'

export type NotifyColor = 'success' | 'error' | 'info'

// アプリ全体で1つのスナックバー状態を共有する(モジュールスコープ)
const state = reactive({
  visible: false,
  color: 'info' as NotifyColor,
  message: '',
})

export function useNotify() {
  const notify = (color: NotifyColor, message: string) => {
    state.color = color
    state.message = message
    state.visible = true
  }
  return { state, notify }
}
