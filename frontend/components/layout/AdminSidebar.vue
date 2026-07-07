<script setup lang="ts">
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  ClipboardList,
  Users,
} from 'lucide-vue-next';

const route = useRoute();

const links = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { to: '/admin/brands', label: 'Thương hiệu', icon: Tag },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/customers', label: 'Khách hàng', icon: Users },
];

function isActive(link: { to: string; exact?: boolean }) {
  if (link.exact) return route.path === link.to;
  return route.path.startsWith(link.to);
}
</script>

<template>
  <aside class="w-56 shrink-0 flex flex-col gap-1">
    <nav class="space-y-0.5">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2',
          isActive(link)
            ? 'bg-accent-muted text-accent border-accent'
            : 'text-fg-muted border-transparent hover:bg-surface-3 hover:text-fg',
        ]"
      >
        <component :is="link.icon" class="w-4 h-4 shrink-0" />
        {{ link.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
