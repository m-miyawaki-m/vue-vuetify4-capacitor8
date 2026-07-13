import type { z } from 'zod'
import { useNotify } from '@/shared/composables/useNotify'

/**
 * API レスポンスの実行時バリデーション(スペック §10)。
 * 失敗 = API 契約違反。開発時は console.error で気づけるようにし、
 * 画面は落とさずデータをそのまま返す(フェイルソフト)。
 */
export function parseOrNotify<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    if (import.meta.env.DEV) console.error('API契約違反:', result.error)
    useNotify().notify('error', 'サーバー応答が想定と異なります')
    return data as z.infer<T>
  }
  return result.data
}
