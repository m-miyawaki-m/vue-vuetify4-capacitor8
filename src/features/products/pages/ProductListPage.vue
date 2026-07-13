<script setup lang="ts">
import MainLayout from '@/shared/components/layout/MainLayout.vue'
import { useProductListPage } from '../composables/useProductListPage'

const { products, goToDetail } = useProductListPage()
</script>

<template>
  <MainLayout title="検索結果" show-back>
    <v-list v-if="products && products.length > 0" lines="two">
      <v-list-item
        v-for="product in products"
        :key="product.id"
        :title="product.name"
        :subtitle="`${product.code} / 棚 ${product.location} / 在庫 ${product.stock}`"
        @click="goToDetail(product.id)"
      />
    </v-list>
    <v-empty-state
      v-else-if="products"
      icon="mdi-magnify"
      title="該当する商品がありません"
      text="条件を変えて再検索してください"
    />
  </MainLayout>
</template>
