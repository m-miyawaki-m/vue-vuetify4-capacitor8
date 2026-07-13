import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { onlineManager } from '@tanstack/vue-query'
import {
  _applyConnectedForTest,
  _resetForTest,
  useNetworkStatus,
} from '@/shared/composables/useNetworkStatus'

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    _resetForTest()
  })
  afterEach(() => {
    vi.useRealTimers()
    onlineManager.setOnline(true)
  })

  it('切断直後(瞬断)ではオフライン表示にならない', () => {
    const { isOffline } = useNetworkStatus()
    _applyConnectedForTest(false)
    expect(isOffline.value).toBe(false)
    vi.advanceTimersByTime(1000)
    _applyConnectedForTest(true) // 瞬断から復帰
    vi.advanceTimersByTime(5000)
    expect(isOffline.value).toBe(false)
  })

  it('切断が続くとオフライン表示になり、復帰で消える', () => {
    const { isOffline } = useNetworkStatus()
    _applyConnectedForTest(false)
    vi.advanceTimersByTime(3000)
    expect(isOffline.value).toBe(true)
    _applyConnectedForTest(true)
    expect(isOffline.value).toBe(false)
  })

  it('vue-query の onlineManager に接続状態が伝播する', () => {
    _applyConnectedForTest(false)
    expect(onlineManager.isOnline()).toBe(false)
    _applyConnectedForTest(true)
    expect(onlineManager.isOnline()).toBe(true)
  })
})
