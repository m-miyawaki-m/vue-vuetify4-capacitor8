import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useCreateStockMovement, useGetProduct } from '@/shared/api/generated/endpoints'
import type { StockMovementRequest } from '@/shared/api/generated/model'
import { useNotify } from '@/shared/composables/useNotify'

/** 詳細ページ: 商品表示 + 入庫/出庫/現品調査の登録(スペック §5) */
export function useProductDetailPage() {
  const route = useRoute()
  const queryClient = useQueryClient()
  const { notify } = useNotify()

  const id = computed(() => String(route.params.id))
  const { data: product } = useGetProduct(id)

  const form = reactive({
    type: 'IN' as StockMovementRequest['type'],
    quantity: 1,
    note: '',
  })

  const canSubmit = computed(() => Number.isInteger(form.quantity) && form.quantity >= 0)

  const { mutate, isPending } = useCreateStockMovement({
    mutation: {
      onSuccess: async () => {
        // 一覧・詳細のキャッシュをまとめて無効化して最新在庫を取り直す
        await queryClient.invalidateQueries({
          predicate: (query) => String(query.queryKey[0]).startsWith('/products'),
        })
        notify('success', '登録しました')
      },
    },
  })

  const submit = () => {
    if (!canSubmit.value) return
    mutate({
      data: {
        productId: id.value,
        type: form.type,
        quantity: form.quantity,
        note: form.note.trim() || undefined,
      },
    })
  }

  return { product, form, canSubmit, isPending, submit }
}
