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
            Your trusted source for high-performance PC components, gaming laptops, and expert build tools.
          </UiText>
        </div>
        <div>
          <UiText as="h4" size="sm" uppercase class="mb-4">Navigation</UiText>
          <ul class="space-y-2 text-sm">
            <li><NuxtLink to="/products" class="text-text-muted hover:text-accent">Products</NuxtLink></li>
            <li><NuxtLink to="/pc-builder" class="text-text-muted hover:text-accent">PC Builder</NuxtLink></li>
            <li><NuxtLink to="/advisor" class="text-text-muted hover:text-accent">AI Advisor</NuxtLink></li>
            <li><NuxtLink to="/cart" class="text-text-muted hover:text-accent">Cart</NuxtLink></li>
          </ul>
        </div>
        <div>
          <UiText as="h4" size="sm" uppercase class="mb-4">Support</UiText>
          <ul class="space-y-2 text-sm text-text-muted">
            <li>Email: support@techshop.com</li>
            <li>Phone: 1900 1234</li>
            <li>Shipping & Returns</li>
          </ul>
        </div>
        <div>
          <UiText as="h4" size="sm" uppercase class="mb-4">Newsletter</UiText>
          <UiText variant="muted" size="sm" class="mb-3">Get exclusive early access to new arrivals.</UiText>
          <form class="flex gap-2" @submit.prevent>
            <UiInput v-model="email" type="email" placeholder="your@email.com" class="flex-1" />
            <UiButton variant="primary" size="md" type="submit">
              <Mail class="w-4 h-4" />
            </UiButton>
          </form>
        </div>
      </div>
      <p class="text-center text-xs text-text-muted mt-10 pt-6 border-t border-subtle">
        © {{ new Date().getFullYear() }} TechShop. All rights reserved.
      </p>
    </UiContainer>
  </footer>
</template>
