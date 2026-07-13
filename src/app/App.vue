<script setup lang="ts">
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import AppLoadingOverlay from '@/shared/components/layout/AppLoadingOverlay.vue'
import AppOfflineOverlay from '@/shared/components/layout/AppOfflineOverlay.vue'
</script>

<template>
  <v-app>
    <router-view />
    <AppSnackbar />
    <AppLoadingOverlay />
    <AppOfflineOverlay />
  </v-app>
</template>
