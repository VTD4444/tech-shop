export type ProductSpecInput = {
  cpuBrand?: string | null;
  cpuSeries?: string | null;
  cpuModel?: string | null;
  ramCapacity?: number | null;
  ramGeneration?: string | null;
  storageCapacity?: number | null;
  storageType?: string | null;
  gpuModel?: string | null;
  screenSize?: number | null;
  specs?: Record<string, string> | null;
};

export function normalizeProductSpecInput(input?: ProductSpecInput | null) {
  if (!input) return null;
  const specs =
    input.specs && typeof input.specs === 'object'
      ? Object.fromEntries(
          Object.entries(input.specs).filter(([k, v]) => k.trim() && String(v).trim()),
        )
      : undefined;

  const hasStructured =
    input.cpuBrand ||
    input.cpuSeries ||
    input.cpuModel ||
    input.ramCapacity ||
    input.ramGeneration ||
    input.storageCapacity ||
    input.storageType ||
    input.gpuModel ||
    input.screenSize ||
    (specs && Object.keys(specs).length > 0);

  if (!hasStructured) return null;

  return {
    cpuBrand: input.cpuBrand || null,
    cpuSeries: input.cpuSeries || null,
    cpuModel: input.cpuModel || null,
    ramCapacity: input.ramCapacity != null ? Number(input.ramCapacity) : null,
    ramGeneration: input.ramGeneration || null,
    storageCapacity: input.storageCapacity != null ? Number(input.storageCapacity) : null,
    storageType: input.storageType || null,
    gpuModel: input.gpuModel || null,
    screenSize: input.screenSize != null ? Number(input.screenSize) : null,
    specs: specs && Object.keys(specs).length ? specs : undefined,
  };
}
