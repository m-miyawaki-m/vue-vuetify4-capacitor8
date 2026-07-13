import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useListProducts } from '@/shared/api/generated/endpoints'
import { ListProductsResponse } from '@/shared/api/generated/schemas.zod'
import { parseOrNotify } from '@/shared/api/validated'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** 一覧ページ: 検索条件は URL クエリが唯一の情報源。queryKey に自動反映される(スペック §6.1) */
export function useProductListPage() {
  const route = useRoute()
  const router = useRouter()

  // computed を渡すことで route.query の変化が queryKey の変化 = 再取得になる
  const params = computed(() => ({
    code: asString(route.query.code),
    keyword: asString(route.query.keyword),
  }))

  const { data } = useListProducts(params, {
    query: {
      select: (response) => parseOrNotify(ListProductsResponse, response),
      // 離脱時に route.query が先にリセットされ不整合な条件で再取得されるため、
      // このルートにいる間だけクエリを有効にする
      enabled: computed(() => route.name === 'product-list'),
    },
  })

  const products = computed(() => data.value)
  const goToDetail = (id: string) => router.push(`/products/${id}`)

  return { products, goToDetail }
}
