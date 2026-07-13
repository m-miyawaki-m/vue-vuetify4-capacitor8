<script setup lang="ts">
import type { StockMovementRequest } from '@/shared/api/generated/model'

const type = defineModel<StockMovementRequest['type']>('type', { required: true })
const quantity = defineModel<number>('quantity', { required: true })
const note = defineModel<string>('note', { default: '' })

const typeItems = [
  { title: '入庫', value: 'IN' },
  { title: '出庫', value: 'OUT' },
  { title: '現品調査(実数)', value: 'ADJUST' },
]
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <v-select v-model="type" :items="typeItems" label="区分" hide-details />
    <v-text-field v-model.number="quantity" type="number" label="数量" min="0" hide-details />
    <v-text-field v-model="note" label="メモ(任意)" hide-details />
  </div>
</template>
