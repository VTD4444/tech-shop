import type { Component } from 'vue';
import {
  Box,
  CircuitBoard,
  Cpu,
  Fan,
  Gpu,
  HardDrive,
  Keyboard,
  Laptop,
  MemoryStick,
  Monitor,
  PlugZap,
} from 'lucide-vue-next';

const CATEGORY_ICON_MAP: Record<string, Component> = {
  cpu: Cpu,
  mainboard: CircuitBoard,
  vga: Gpu,
  ram: MemoryStick,
  storage: HardDrive,
  psu: PlugZap,
  case: Box,
  cooler: Fan,
  laptop: Laptop,
  laptops: Laptop,
  components: Cpu,
  monitors: Monitor,
  peripherals: Keyboard,
};

export function getCategoryIcon(slug: string): Component {
  return CATEGORY_ICON_MAP[slug.toLowerCase()] || Cpu;
}
