import { describe, expect, it } from 'vitest'
import {
  getGetProductQueryKey,
  getListProductsQueryKey,
} from '@/shared/api/generated/endpoints'

// useProductDetailPage の invalidateQueries({ queryKey: ['products'] }) は
// 生成 queryKey が 'products' で始まることに依存している。
// orval 再生成でキー形式が変わったらこのテストで検知する。
describe('生成 queryKey の契約', () => {
  it('一覧・詳細の queryKey は products 接頭辞を持つ', () => {
    expect(getListProductsQueryKey()[0]).toBe('products')
    expect(getGetProductQueryKey('p-001')[0]).toBe('products')
  })
})
