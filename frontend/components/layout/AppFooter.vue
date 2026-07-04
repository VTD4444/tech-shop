<script setup lang="ts">
import { Mail } from 'lucide-vue-next';

const email = ref('');
</script>

<template>
  <footer class="border-t border-subtle bg-surface-1 mt-auto">
    <UiContainer class="py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p class="text-lg font-bold text-text-primary mb-3">
            TECH<span class="text-accent">SHOP</span>
          </p>
          <UiText variant="muted" size="sm" class="leading-relaxed">
            Nguồn tin cậy cho linh kiện PC hiệu năng cao, laptop gaming và công cụ xây dựng cấu hình chuyên nghiệp.
          </UiText>
        </div>
        <div>
          <UiText as="h4" size="sm" uppercase class="mb-4">Điều hướng</UiText>
          <ul class="space-y-2 text-sm">
            <li><NuxtLink to="/products" class="text-text-muted hover:text-accent">Sản phẩm</NuxtLink></li>
            <li><NuxtLink to="/pc-builder" class="text-text-muted hover:text-accent">Xây dựng PC</NuxtLink></li>
            <li><NuxtLink to="/advisor" class="text-text-muted hover:text-accent">Tư vấn AI</NuxtLink></li>
            <li><NuxtLink to="/cart" class="text-text-muted hover:text-accent">Giỏ hàng</NuxtLink></li>
          </ul>
        </div>
        <div>
          <UiText as="h4" size="sm" uppercase class="mb-4">Hỗ trợ</UiText>
          <ul class="space-y-2 text-sm text-text-muted">
            <li>Email: support@techshop.com</li>
            <li>Điện thoại: 1900 1234</li>
            <li>Giao hàng & đổi trả</li>
          </ul>
        </div>
        <div>
          <UiText as="h4" size="sm" uppercase class="mb-4">Bản tin</UiText>
          <UiText variant="muted" size="sm" class="mb-3">Nhận quyền truy cập sớm độc quyền cho sản phẩm mới.</UiText>
          <form class="flex gap-2" @submit.prevent>
            <UiInput v-model="email" type="email" placeholder="email@cuaban.com" class="flex-1" />
            <UiButton variant="primary" size="md" type="submit">
              <Mail class="w-4 h-4" />
            </UiButton>
          </form>
        </div>
      </div>
      <p class="text-center text-xs text-text-muted mt-10 pt-6 border-t border-subtle">
        © {{ new Date().getFullYear() }} TechShop. Bảo lưu mọi quyền.
      </p>
    </UiContainer>
  </footer>
</template>
