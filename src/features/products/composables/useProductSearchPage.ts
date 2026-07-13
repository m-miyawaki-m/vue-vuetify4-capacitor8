import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { ProductSearchCondition } from '../types'

/** 商品検索ページ: 条件を組み立てて一覧へ遷移するだけ(API は叩かない。スペック §6.1) */
export function useProductSearchPage() {
  const router = useRouter()
  const condition = reactive<ProductSearchCondition>({ code: '', keyword: '' })

  const canSearch = computed(() => !!(condition.code.trim() || condition.keyword.trim()))

  const goToList = () => {
    if (!canSearch.value) return
    const query: Record<string, string> = {}
    if (condition.code.trim()) query.code = condition.code.trim()
    if (condition.keyword.trim()) query.keyword = condition.keyword.trim()
    router.push({ path: '/products', query })
  }

  return { condition, canSearch, goToList }
}
