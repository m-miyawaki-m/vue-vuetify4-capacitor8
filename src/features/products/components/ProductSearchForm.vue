<script setup lang="ts">
const code = defineModel<string>('code', { default: '' })
const keyword = defineModel<string>('keyword', { default: '' })

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="d-flex flex-column ga-2">
    <v-text-field
      v-model="code"
      data-testid="code-input"
      label="商品コード"
      clearable
      hide-details
      @keyup.enter="emit('submit')"
    />
    <v-text-field
      v-model="keyword"
      data-testid="keyword-input"
      label="品名キーワード"
      clearable
      hide-details
      @keyup.enter="emit('submit')"
    />
  </div>
</template>
