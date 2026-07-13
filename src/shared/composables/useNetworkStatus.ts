import { computed, ref } from 'vue'
import { Network } from '@capacitor/network'
import { onlineManager } from '@tanstack/vue-query'
import { axiosInstance } from '@/shared/api/mutator'

// 瞬断(棚の陰など)でオーバーレイを出さないための猶予
const OFFLINE_DELAY_MS = 2500

const isOffline = ref(false)
const offlineSince = ref<number | null>(null)
let offlineTimer: ReturnType<typeof setTimeout> | undefined

function applyConnected(connected: boolean) {
  // vue-query に伝播: オフライン中はクエリ/ミューテーションを一時停止、復帰で自動再開
  onlineManager.setOnline(connected)
  clearTimeout(offlineTimer)
  if (connected) {
    isOffline.value = false
    offlineSince.value = null
  } else {
    offlineTimer = setTimeout(() => {
      isOffline.value = true
      offlineSince.value = Date.now()
    }, OFFLINE_DELAY_MS)
  }
}

/**
 * アプリ起動時に1回だけ呼ぶ(スペック §7.5)。
 * @capacitor/network は Web 実装(navigator.onLine ベース)を持つためブラウザ開発でも動く。
 * VITE_DISABLE_OFFLINE_OVERLAY=true で検知層ごと無効化できる。
 */
export async function initNetworkWatch() {
  if (import.meta.env.VITE_DISABLE_OFFLINE_OVERLAY === 'true') return
  const status = await Network.getStatus()
  applyConnected(status.connected)
  await Network.addListener('networkStatusChange', (s) => applyConnected(s.connected))
}

export function useNetworkStatus() {
  /** 手動再試行: 接続表示に頼らず /health で実疎通を確認する */
  const retry = async () => {
    try {
      await axiosInstance.get('/health')
      applyConnected(true)
    } catch {
      // 依然オフライン。表示は変えない(ユーザーは再度押せる)
    }
  }
  return {
    isOffline: computed(() => isOffline.value),
    offlineSince: computed(() => offlineSince.value),
    retry,
  }
}

// --- テスト専用 ---
export function _applyConnectedForTest(connected: boolean) {
  applyConnected(connected)
}
export function _resetForTest() {
  clearTimeout(offlineTimer)
  isOffline.value = false
  offlineSince.value = null
}
