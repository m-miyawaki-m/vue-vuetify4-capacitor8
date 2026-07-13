import { computed, ref } from 'vue'
import { useIsFetching, useIsMutating } from '@tanstack/vue-query'

// ルーター遷移中フラグ(アプリ全体で1つ)
const isNavigating = ref(false)

/** router のナビゲーションガードから呼ぶ */
export function setNavigating(value: boolean) {
  isNavigating.value = value
}

/**
 * グローバルローディングの表示判定(スペック §7)。
 * バックグラウンド再取得(キャッシュ表示中の裏取得)ではスピナーを出さないため、
 * キャッシュ未保持(= 初回取得)のクエリのみを数える。ミューテーションは常に対象。
 */
export function useGlobalLoading() {
  const initialFetchCount = useIsFetching({
    predicate: (query) => query.state.data === undefined,
  })
  const mutationCount = useIsMutating()
  const isLoading = computed(
    () => isNavigating.value || initialFetchCount.value > 0 || mutationCount.value > 0,
  )
  return { isLoading }
}
