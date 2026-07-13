<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  title: string
  showBack?: boolean
}>()

const router = useRouter()
const back = () => router.back()
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <template v-if="showBack" #prepend>
      <v-btn data-testid="back-button" icon="mdi-arrow-left" @click="back" />
    </template>
    <v-app-bar-title>{{ title }}</v-app-bar-title>
  </v-app-bar>

  <v-main>
    <slot />
  </v-main>

  <v-footer v-if="$slots.footer" app class="pa-3">
    <div class="w-100">
      <slot name="footer" />
    </div>
  </v-footer>
</template>
