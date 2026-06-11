# Development Guide

## Adding a New Module (Backend)

1. Create folder `backend/src/modules/<name>/`
2. Create files: `<name>.module.ts`, `<name>.service.ts`, `<name>.controller.ts`
3. Register module in `app.module.ts`
4. If new DB table needed: add model to `prisma/schema.prisma`, run `npx prisma migrate dev`

### Module Template

```typescript
// your.module.ts
import { Module } from '@nestjs/common';
import { YourController } from './your.controller';
import { YourService } from './your.service';

@Module({
  controllers: [YourController],
  providers: [YourService],
  exports: [YourService],
})
export class YourModule {}
```

```typescript
// your.controller.ts
import { Controller, Get } from '@nestjs/common';
import { YourService } from './your.service';

@Controller('your-route')
export class YourController {
  constructor(private yourService: YourService) {}

  @Get()
  findAll() {
    return this.yourService.findAll();
  }
}
```

## Adding a New Page (Frontend)

1. Create file in `frontend/pages/` (file-based routing)
2. Add `<script setup lang="ts">` with Composition API
3. Use `useFetch` or `useAsyncData` for SSR data fetching
4. Use `definePageMeta({ middleware: 'auth' })` for protected pages

### Page Template

```vue
<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold">Page Title</h1>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
const { $api } = useNuxtApp();

const { data } = await useAsyncData('key', () => $api('/endpoint'));
</script>
```

## Adding a New Store

1. Create file in `frontend/stores/<name>.store.ts`
2. Use Pinia `defineStore` with Composition API syntax

```typescript
export const useExampleStore = defineStore('example', () => {
  const items = ref<any[]>([]);
  const loading = ref(false);

  async function fetchItems() {
    const { $api } = useNuxtApp();
    const data: any = await $api('/endpoint');
    items.value = data.data || [];
  }

  return { items, loading, fetchItems };
});
```

## Adding a New Component

1. Create file in `frontend/components/<category>/<Name>.vue`
2. PascalCase name, auto-imported by Nuxt

## Adding PC Builder Compatibility Rules

Edit `backend/src/modules/pc-builder/pc-builder.service.ts`:

1. Add rule in `validateBuild()` method
2. Push `CompatibilityIssue` to `issues[]` array
3. Test with `POST /pc-builder/validate`

### Current Rules

| # | Rule | Type | Condition |
|---|---|---|---|
| 1 | CPU ↔ Mainboard socket | error | `cpu.socket !== mb.socket` |
| 2 | RAM gen ↔ Mainboard | error | `ram.ramGeneration !== mb.ramGeneration` |
| 3 | RAM capacity vs limit | error | `ram.ramCapacity > mb.maxRamCapacity` |
| 4 | GPU length vs case | error | `gpu.gpuLengthMm > pcCase.maxGpuLengthMm` |
| 5 | Cooler height vs case | error | `cooler.cpuCoolerHeightMm > pcCase.maxCpuCoolerHeightMm` |
| 6 | Form factor vs case | error | MB form not in case form factors |
| 7 | Power budget | error/warning | Total > PSU wattage / > 90% |

## Common Tasks

### Run Migration After Schema Change
```bash
cd backend
npx prisma migrate dev --name describe_change
```

### Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

### Seed Database
```bash
cd backend
npx prisma db seed
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

### Lint
```bash
cd backend && npm run lint
cd frontend && npm run lint  # if configured
```
