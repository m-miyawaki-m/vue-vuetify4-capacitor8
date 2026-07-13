<script setup lang="ts">
import MainLayout from '@/shared/components/layout/MainLayout.vue'
import StockMovementForm from '../components/StockMovementForm.vue'
import { useProductDetailPage } from '../composables/useProductDetailPage'

const { product, form, canSubmit, isPending, submit } = useProductDetailPage()
</script>

<template>
  <MainLayout title="商品詳細" show-back>
    <v-container v-if="product">
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-h6">{{ product.name }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-1 text-body-2">
            <div>コード: {{ product.code }}</div>
            <div>棚番: {{ product.location }}</div>
            <div>在庫数: {{ product.stock }}</div>
          </div>
        </v-card-text>
      </v-card>
      <StockMovementForm
        v-model:type="form.type"
        v-model:quantity="form.quantity"
        v-model:note="form.note"
      />
    </v-container>
    <template #footer>
      <v-btn block color="primary" size="large" :disabled="!canSubmit || isPending" @click="submit">
        登録
      </v-btn>
    </template>
  </MainLayout>
</template>
