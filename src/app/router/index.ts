import { createRouter, createWebHashHistory } from 'vue-router'
import { setNavigating } from '@/shared/composables/useGlobalLoading'

// hash history: Capacitor WebView(file/https ローカル配信)でサーバー側リライト不要のため
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // 機能ルートは各 feature 追加時にここへ登録する(Task 10 で products を追加)
  ],
})

router.beforeEach(() => {
  setNavigating(true)
})
router.afterEach(() => {
  setNavigating(false)
})
router.onError(() => {
  setNavigating(false)
})

export default router
