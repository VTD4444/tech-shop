import { BadRequestException } from '@nestjs/common';

export const PC_COMPONENT_TYPES = [
  'CPU',
  'MAINBOARD',
  'RAM',
  'VGA',
  'STORAGE',
  'PSU',
  'CASE',
  'COOLER',
] as const;

export type PcComponentType = (typeof PC_COMPONENT_TYPES)[number];

export type PcComponentInput = {
  componentType?: string;
  socket?: string | null;
  chipset?: string | null;
  ramGeneration?: string | null;
  ramSlots?: number | null;
  maxRamCapacity?: number | null;
  ramCapacity?: number | null;
  ramBus?: number | null;
  formFactor?: string | null;
  gpuLengthMm?: number | null;
  maxGpuLengthMm?: number | null;
  cpuCoolerHeightMm?: number | null;
  maxCpuCoolerHeightMm?: number | null;
  powerConsumption?: number | null;
  powerSupplyWatt?: number | null;
  pcieVersion?: string | null;
  storageInterface?: string | null;
};

const REQUIRED_FIELDS: Partial<Record<PcComponentType, (keyof PcComponentInput)[]>> = {
  CPU: ['socket', 'powerConsumption'],
  MAINBOARD: ['socket', 'ramGeneration', 'formFactor'],
  RAM: ['ramGeneration', 'ramCapacity'],
  VGA: ['gpuLengthMm', 'powerConsumption'],
  PSU: ['powerSupplyWatt'],
  CASE: ['formFactor', 'maxGpuLengthMm', 'maxCpuCoolerHeightMm'],
  COOLER: ['cpuCoolerHeightMm'],
  STORAGE: ['storageInterface'],
};

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
}

export function normalizePcComponentInput(input: PcComponentInput) {
  const componentType = parseOptionalString(input.componentType)?.toUpperCase();
  if (!componentType || !PC_COMPONENT_TYPES.includes(componentType as PcComponentType)) {
    throw new BadRequestException(`Invalid component type. Allowed: ${PC_COMPONENT_TYPES.join(', ')}`);
  }

  const data = {
    componentType,
    socket: parseOptionalString(input.socket),
    chipset: parseOptionalString(input.chipset),
    ramGeneration: parseOptionalString(input.ramGeneration)?.toUpperCase() ?? null,
    ramSlots: parseOptionalInt(input.ramSlots),
    maxRamCapacity: parseOptionalInt(input.maxRamCapacity),
    ramCapacity: parseOptionalInt(input.ramCapacity),
    ramBus: parseOptionalInt(input.ramBus),
    formFactor: parseOptionalString(input.formFactor),
    gpuLengthMm: parseOptionalInt(input.gpuLengthMm),
    maxGpuLengthMm: parseOptionalInt(input.maxGpuLengthMm),
    cpuCoolerHeightMm: parseOptionalInt(input.cpuCoolerHeightMm),
    maxCpuCoolerHeightMm: parseOptionalInt(input.maxCpuCoolerHeightMm),
    powerConsumption: parseOptionalInt(input.powerConsumption),
    powerSupplyWatt: parseOptionalInt(input.powerSupplyWatt),
    pcieVersion: parseOptionalString(input.pcieVersion),
    storageInterface: parseOptionalString(input.storageInterface),
  };

  const required = REQUIRED_FIELDS[componentType as PcComponentType] ?? [];
  for (const field of required) {
    if (data[field] == null || data[field] === '') {
      throw new BadRequestException(`PC component field "${field}" is required for type ${componentType}`);
    }
  }

  return data;
}
