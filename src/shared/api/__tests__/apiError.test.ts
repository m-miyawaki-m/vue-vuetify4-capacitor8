import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, toApiError } from '@/shared/api/apiError'

function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data,
  })
}

describe('toApiError', () => {
  it('ErrorResponse の message と status を取り出す', () => {
    const error = toApiError(axiosErrorWithResponse(404, { message: '商品が見つかりません' }))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('商品が見つかりません')
    expect(error.status).toBe(404)
  })

  it('レスポンスなし(ネットワークエラー)は汎用メッセージになる', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error.message).toBe('通信に失敗しました')
    expect(error.status).toBeUndefined()
  })

  it('通常の Error はメッセージを引き継ぐ', () => {
    const error = toApiError(new Error('boom'))
    expect(error.message).toBe('boom')
  })
})
