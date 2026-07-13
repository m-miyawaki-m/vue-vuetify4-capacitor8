<script setup lang="ts">
import MainLayout from '@/shared/components/layout/MainLayout.vue'
import ProductSearchForm from '../components/ProductSearchForm.vue'
import { useProductSearchPage } from '../composables/useProductSearchPage'

const { condition, canSearch, goToList } = useProductSearchPage()
</script>

<template>
  <MainLayout title="商品検索">
    <v-container>
      <ProductSearchForm
        v-model:code="condition.code"
        v-model:keyword="condition.keyword"
        @submit="goToList"
      />
    </v-container>
    <template #footer>
      <v-btn block color="primary" size="large" :disabled="!canSearch" @click="goToList">
        検索
      </v-btn>
    </template>
  </MainLayout>
</template>
