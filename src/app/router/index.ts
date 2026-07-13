import { createRouter, createWebHashHistory } from 'vue-router'

// hash history: Capacitor WebView(file/https ローカル配信)でサーバー側リライト不要のため
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // 機能ルートは各 feature 追加時にここへ登録する(Task 10 で products を追加)
  ],
})

export default router
