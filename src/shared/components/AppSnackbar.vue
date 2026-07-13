<script setup lang="ts">
import { useNotify } from '@/shared/composables/useNotify'

const { state } = useNotify()
</script>

<template>
  <v-snackbar v-model="state.visible" :color="state.color" :timeout="3000" location="top">
    {{ state.message }}
  </v-snackbar>
</template>
