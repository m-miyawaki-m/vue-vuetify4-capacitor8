<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { useNetworkStatus } from '@/shared/composables/useNetworkStatus'

const { isOffline, offlineSince, retry } = useNetworkStatus()

// 30秒復帰しなければ追加の案内を出す(スペック §7.5 エスカレーション)
const ESCALATION_MS = 30_000
const now = ref(Date.now())
const timer = setInterval(() => {
  now.value = Date.now()
}, 1000)
onScopeDispose(() => clearInterval(timer))

const showEscalation = computed(
  () => offlineSince.value !== null && now.value - offlineSince.value > ESCALATION_MS,
)
</script>

<template>
  <v-overlay
    :model-value="isOffline"
    persistent
    no-click-animation
    class="align-center justify-center"
    :z-index="3000"
  >
    <v-card class="pa-6 text-center" max-width="320">
      <v-icon icon="mdi-wifi-off" size="48" color="error" class="mb-2" />
      <div class="text-h6 mb-1">オフラインです</div>
      <div class="text-body-2 mb-4">再接続を待っています…</div>
      <v-btn color="primary" block @click="retry">再試行</v-btn>
      <template v-if="showEscalation">
        <v-divider class="my-4" />
        <div class="text-body-2">
          端末の Wi-Fi 設定を確認してください。復帰しない場合は管理者に連絡してください。
        </div>
      </template>
    </v-card>
  </v-overlay>
</template>
