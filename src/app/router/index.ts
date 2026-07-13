import { createRouter, createWebHashHistory } from 'vue-router'
import { setNavigating } from '@/shared/composables/useGlobalLoading'

// hash history: Capacitor WebView(file/https ローカル配信)でサーバー側リライト不要のため
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/products/search' },
    {
      path: '/products/search',
      component: () => import('@/features/products/pages/ProductSearchPage.vue'),
    },
    {
      path: '/products',
      component: () => import('@/features/products/pages/ProductListPage.vue'),
    },
    {
      path: '/products/:id',
      component: () => import('@/features/products/pages/ProductDetailPage.vue'),
    },
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
