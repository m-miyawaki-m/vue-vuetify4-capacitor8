<script setup lang="ts">
import AppSnackbar from '@/shared/components/AppSnackbar.vue'
</script>

<template>
  <v-app>
    <router-view />
    <AppSnackbar />
  </v-app>
</template>
