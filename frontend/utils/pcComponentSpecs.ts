export const PC_COMPONENT_TYPES = [
  { value: 'CPU', label: 'CPU' },
  { value: 'MAINBOARD', label: 'Mainboard' },
  { value: 'RAM', label: 'RAM' },
  { value: 'VGA', label: 'VGA / GPU' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'PSU', label: 'PSU' },
  { value: 'CASE', label: 'Case' },
  { value: 'COOLER', label: 'Cooler' },
] as const;

export type PcComponentField = {
  key: string;
  label: string;
  type: 'text' | 'number';
  placeholder?: string;
  hint?: string;
};

export const PC_COMPONENT_FIELDS: Record<string, PcComponentField[]> = {
  CPU: [
    { key: 'socket', label: 'Socket', type: 'text', placeholder: 'LGA1700', hint: 'Khớp với mainboard' },
    { key: 'powerConsumption', label: 'TDP (W)', type: 'number', placeholder: '125', hint: 'Cộng vào tổng watt PSU' },
  ],
  MAINBOARD: [
    { key: 'socket', label: 'Socket', type: 'text', placeholder: 'LGA1700' },
    { key: 'ramGeneration', label: 'RAM generation', type: 'text', placeholder: 'DDR5' },
    { key: 'ramSlots', label: 'RAM slots', type: 'number', placeholder: '4' },
    { key: 'maxRamCapacity', label: 'Max RAM (GB)', type: 'number', placeholder: '128' },
    { key: 'formFactor', label: 'Form factor', type: 'text', placeholder: 'ATX', hint: 'Phải nằm trong form factor case hỗ trợ' },
    { key: 'powerConsumption', label: 'Power draw (W)', type: 'number', placeholder: '30' },
  ],
  RAM: [
    { key: 'ramGeneration', label: 'RAM generation', type: 'text', placeholder: 'DDR5' },
    { key: 'ramCapacity', label: 'Kit capacity (GB)', type: 'number', placeholder: '32' },
    { key: 'ramBus', label: 'Bus speed (MHz)', type: 'number', placeholder: '5600' },
    { key: 'powerConsumption', label: 'Power draw (W)', type: 'number', placeholder: '10' },
  ],
  VGA: [
    { key: 'gpuLengthMm', label: 'GPU length (mm)', type: 'number', placeholder: '310', hint: 'So với maxGpuLengthMm của case' },
    { key: 'pcieVersion', label: 'PCIe version', type: 'text', placeholder: '4.0' },
    { key: 'powerConsumption', label: 'Power draw (W)', type: 'number', placeholder: '220' },
  ],
  STORAGE: [
    { key: 'storageInterface', label: 'Interface', type: 'text', placeholder: 'M.2 NVMe' },
    { key: 'powerConsumption', label: 'Power draw (W)', type: 'number', placeholder: '6' },
  ],
  PSU: [
    { key: 'powerSupplyWatt', label: 'Rated wattage (W)', type: 'number', placeholder: '750' },
    { key: 'formFactor', label: 'Form factor', type: 'text', placeholder: 'ATX' },
  ],
  CASE: [
    { key: 'formFactor', label: 'Supported boards', type: 'text', placeholder: 'ATX / Micro-ATX / Mini-ITX' },
    { key: 'maxGpuLengthMm', label: 'Max GPU length (mm)', type: 'number', placeholder: '360' },
    { key: 'maxCpuCoolerHeightMm', label: 'Max cooler height (mm)', type: 'number', placeholder: '170' },
  ],
  COOLER: [
    { key: 'socket', label: 'Supported socket(s)', type: 'text', placeholder: 'LGA1700 / AM5' },
    { key: 'cpuCoolerHeightMm', label: 'Cooler height (mm)', type: 'number', placeholder: '155' },
    { key: 'powerConsumption', label: 'Power draw (W)', type: 'number', placeholder: '5' },
  ],
};

export function emptyPcComponentForm() {
  return {
    componentType: '',
    socket: '',
    chipset: '',
    ramGeneration: '',
    ramSlots: '' as number | string,
    maxRamCapacity: '' as number | string,
    ramCapacity: '' as number | string,
    ramBus: '' as number | string,
    formFactor: '',
    gpuLengthMm: '' as number | string,
    maxGpuLengthMm: '' as number | string,
    cpuCoolerHeightMm: '' as number | string,
    maxCpuCoolerHeightMm: '' as number | string,
    powerConsumption: '' as number | string,
    powerSupplyWatt: '' as number | string,
    pcieVersion: '',
    storageInterface: '',
  };
}

export function pcComponentFromInitial(initial?: Record<string, any>) {
  const base = emptyPcComponentForm();
  if (!initial) return base;
  for (const key of Object.keys(base) as (keyof typeof base)[]) {
    const value = initial[key];
    if (value !== null && value !== undefined) {
      (base as any)[key] = value;
    }
  }
  return base;
}

export function buildPcComponentPayload(form: ReturnType<typeof emptyPcComponentForm>) {
  const payload: Record<string, unknown> = { componentType: form.componentType };
  for (const [key, value] of Object.entries(form)) {
    if (key === 'componentType') continue;
    if (value === '' || value === null || value === undefined) continue;
    payload[key] = value;
  }
  return payload;
}
