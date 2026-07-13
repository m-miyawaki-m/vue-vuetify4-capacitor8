<script setup lang="ts">
import { useGlobalLoading } from '@/shared/composables/useGlobalLoading'

const { isLoading } = useGlobalLoading()
</script>

<template>
  <v-overlay
    :model-value="isLoading"
    persistent
    no-click-animation
    class="align-center justify-center"
    :z-index="2000"
  >
    <v-progress-circular indeterminate size="48" color="primary" />
  </v-overlay>
</template>
