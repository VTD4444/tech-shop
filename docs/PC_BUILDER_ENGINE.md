# PC Builder Compatibility Engine

## Overview

The PC Builder is a server-side compatibility validation engine in `backend/src/modules/pc-builder/pc-builder.service.ts`. It validates hardware compatibility across 8 component types.

## Component Types

| Type | Required | Key Compatibility Fields |
|---|---|---|
| CPU | Yes | `socket`, `ramGeneration`, `powerConsumption` |
| MAINBOARD | Yes | `socket`, `ramGeneration`, `ramSlots`, `maxRamCapacity`, `formFactor` |
| RAM | No | `ramGeneration`, `ramCapacity`, `ramBus` |
| VGA | No | `gpuLengthMm`, `powerConsumption`, `pcieVersion` |
| STORAGE | No | `storageInterface`, `powerConsumption` |
| PSU | No | `powerSupplyWatt`, `formFactor` |
| CASE | No | `formFactor`, `maxGpuLengthMm`, `maxCpuCoolerHeightMm` |
| COOLER | No | `cpuCoolerHeightMm`, `powerConsumption` |

## Component Listing with Compatibility

```
GET /pc-builder/components?type=VGA&selectedIds=1,2,3
  → For each candidate component, run validateBuild([...selectedIds, candidateId])
  → Annotate: { compatible: boolean, incompatibilityReasons: string[] }
  → Frontend uses this to hide/disable incompatible options in the picker modal
```

Without `selectedIds`, all components return `compatible: true`.

## Validation Flow

```
POST /pc-builder/validate { componentIds: [...] }
  → Fetch pc_components WHERE id IN (componentIds) JOIN products
  → Map to BuildComponent[]
  → Categorize by componentType (cpu, mb, ram, vga, psu, case, cooler, storage)
  → Apply 6 compatibility rules
  → Calculate totalWattage, totalPrice
  → Return CompatibilityResult
```

## Rule Details

### Rule 1: CPU ↔ Mainboard Socket
```
IF cpu.socket != mb.socket → ERROR
```
Ensures CPU physically fits the motherboard socket (e.g., LGA1700 ↔ LGA1700).

### Rule 2: RAM Generation
```
IF ram.ramGeneration != mb.ramGeneration → ERROR
```
Ensures motherboard supports the RAM type (DDR4 vs DDR5).

### Rule 3: RAM Capacity
```
IF ram.ramCapacity > mb.maxRamCapacity → ERROR
```
Ensures total RAM doesn't exceed motherboard limit.

### Rule 4: GPU Length
```
IF gpu.gpuLengthMm > pcCase.maxGpuLengthMm → ERROR
```
Ensures GPU physically fits inside the case.

### Rule 5: Cooler Height
```
IF cooler.cpuCoolerHeightMm > pcCase.maxCpuCoolerHeightMm → ERROR
```
Ensures CPU cooler height fits inside the case.

### Rule 6: Form Factor
```
IF case.formFactors (split by '/') does not include mb.formFactor → ERROR
```
Ensures motherboard form factor (ATX, Micro-ATX, Mini-ITX) fits the case.

### Rule 7: Power Budget
```
IF totalWattage > psu.powerSupplyWatt → ERROR
IF totalWattage > 0.9 * psu.powerSupplyWatt → WARNING
```

## Adding a New Rule

1. In `pc-builder.service.ts`, inside `validateBuild()`:
```typescript
// Example: PCIe version compatibility
if (gpu && mb && gpu.pcieVersion && mb.pcieVersion) {
  // Compare major versions
  const gpuMajor = parseInt(gpu.pcieVersion.split('.')[0]);
  const mbMajor = parseInt(mb.pcieVersion.split('.')[0]);
  if (gpuMajor > mbMajor) {
    issues.push({
      type: 'warning',
      message: `GPU PCIe ${gpu.pcieVersion} may be limited by Mainboard PCIe ${mb.pcieVersion}`,
    });
  }
}
```

## Validation Response

```typescript
interface CompatibilityResult {
  compatible: boolean;        // No errors → true
  issues: CompatibilityIssue[];
  totalWattage: number;       // Sum of all powerConsumption
  totalPrice: number;         // Sum of product prices
  psuWattage: number | null;  // PSU capacity
}

interface CompatibilityIssue {
  type: 'error' | 'warning';
  message: string;
  componentA?: string;  // Product name for first component
  componentB?: string;  // Product name for second component
}
```

## Saved Builds & Cart

Compatibility checks are **advisory**. Users may save a build or add all selected parts to the cart even when validation reports errors.

```
POST /pc-builder/build { name, componentIds[] }
  → Calls validateBuild for totalPrice (does not reject incompatible builds)
  → Creates saved_build + saved_build_items
  → Returns build with items

Add to cart (frontend): loops POST /cart for each selected product — no compatibility gate

GET /pc-builder/builds       → List user's builds
GET /pc-builder/builds/:id   → Build detail
DELETE /pc-builder/builds/:id
```
