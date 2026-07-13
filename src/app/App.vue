<script setup lang="ts">
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
import AppLoadingOverlay from '@/shared/components/layout/AppLoadingOverlay.vue'
</script>

<template>
  <v-app>
    <router-view />
    <AppSnackbar />
    <AppLoadingOverlay />
  </v-app>
</template>
