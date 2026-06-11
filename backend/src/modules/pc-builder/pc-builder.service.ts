import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface BuildComponent {
  id: string;
  productId: string;
  componentType: string;
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
  product?: any;
}

interface CompatibilityIssue {
  type: 'error' | 'warning';
  message: string;
  componentA?: string;
  componentB?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
  totalWattage: number;
  totalPrice: number;
  psuWattage: number | null;
}

@Injectable()
export class PcBuilderService {
  constructor(private prisma: PrismaService) {}

  async getComponents(type?: string) {
    const where: any = {};
    if (type) where.componentType = type.toUpperCase();

    const components = await this.prisma.pcComponent.findMany({
      where: { ...where, product: { status: 'active' } },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true,
            imageUrl: true, description: true,
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    return components.map((c) => ({
      ...c,
      id: c.id.toString(),
      productId: c.productId.toString(),
      product: { ...c.product, id: c.product.id.toString(), price: Number(c.product.price) },
    }));
  }

  async validateBuild(componentIds: string[]): Promise<CompatibilityResult> {
    const components = await this.prisma.pcComponent.findMany({
      where: { id: { in: componentIds.map((id) => BigInt(id)) } },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, imageUrl: true },
        },
      },
    });

    if (components.length !== componentIds.length) {
      throw new NotFoundException('One or more components not found');
    }

    const mapped: BuildComponent[] = components.map((c) => ({
      ...c,
      id: c.id.toString(),
      productId: c.productId.toString(),
      product: { ...c.product, id: c.product.id.toString(), price: Number(c.product.price) },
    }));

    const issues: CompatibilityIssue[] = [];
    let totalWattage = 0;
    let totalPrice = 0;
    let psuWattage: number | null = null;

    const cpu = mapped.find((c) => c.componentType === 'CPU');
    const mb = mapped.find((c) => c.componentType === 'MAINBOARD');
    const ram = mapped.find((c) => c.componentType === 'RAM');
    const gpu = mapped.find((c) => c.componentType === 'VGA');
    const psu = mapped.find((c) => c.componentType === 'PSU');
    const pcCase = mapped.find((c) => c.componentType === 'CASE');
    const cooler = mapped.find((c) => c.componentType === 'COOLER');
    const storage = mapped.find((c) => c.componentType === 'STORAGE');

    for (const comp of mapped) {
      totalWattage += comp.powerConsumption || 0;
      totalPrice += Number(comp.product?.price || 0);
      if (comp.componentType === 'PSU') psuWattage = comp.powerSupplyWatt ?? null;
    }

    // CPU ↔ Mainboard: socket
    if (cpu && mb && cpu.socket && mb.socket && cpu.socket !== mb.socket) {
      issues.push({
        type: 'error',
        message: `CPU socket (${cpu.socket}) không tương thích với Mainboard socket (${mb.socket})`,
        componentA: cpu.product?.name,
        componentB: mb.product?.name,
      });
    }

    // RAM gen ↔ Mainboard
    if (ram && mb && ram.ramGeneration && mb.ramGeneration && ram.ramGeneration !== mb.ramGeneration) {
      issues.push({
        type: 'error',
        message: `RAM ${ram.ramGeneration} không tương thích với Mainboard ${mb.ramGeneration}`,
        componentA: ram.product?.name,
        componentB: mb.product?.name,
      });
    }

    // RAM capacity check
    if (ram && mb && mb.maxRamCapacity && ram.ramCapacity && ram.ramCapacity > mb.maxRamCapacity) {
      issues.push({
        type: 'error',
        message: `RAM dung lượng ${ram.ramCapacity}GB vượt quá hỗ trợ tối đa của Mainboard (${mb.maxRamCapacity}GB)`,
      });
    }

    // GPU length ↔ Case
    if (gpu && pcCase && gpu.gpuLengthMm && pcCase.maxGpuLengthMm && gpu.gpuLengthMm > pcCase.maxGpuLengthMm) {
      issues.push({
        type: 'error',
        message: `GPU dài ${gpu.gpuLengthMm}mm không vừa Case (tối đa ${pcCase.maxGpuLengthMm}mm)`,
        componentA: gpu.product?.name,
        componentB: pcCase.product?.name,
      });
    }

    // Cooler height ↔ Case
    if (cooler && pcCase && cooler.cpuCoolerHeightMm && pcCase.maxCpuCoolerHeightMm && cooler.cpuCoolerHeightMm > pcCase.maxCpuCoolerHeightMm) {
      issues.push({
        type: 'error',
        message: `Tản nhiệt cao ${cooler.cpuCoolerHeightMm}mm không vừa Case (tối đa ${pcCase.maxCpuCoolerHeightMm}mm)`,
        componentA: cooler.product?.name,
        componentB: pcCase.product?.name,
      });
    }

    // Form factor ↔ Case
    if (mb && pcCase && mb.formFactor && pcCase.formFactor) {
      const caseFormFactors = pcCase.formFactor.split('/').map((s) => s.trim());
      if (!caseFormFactors.includes(mb.formFactor)) {
        issues.push({
          type: 'error',
          message: `Mainboard ${mb.formFactor} không vừa Case (hỗ trợ: ${pcCase.formFactor})`,
          componentA: mb.product?.name,
          componentB: pcCase.product?.name,
        });
      }
    }

    // Power
    if (psu && totalWattage > psuWattage!) {
      issues.push({
        type: 'error',
        message: `Tổng công suất ${totalWattage}W vượt quá PSU ${psuWattage}W`,
      });
    } else if (psu && totalWattage > psuWattage! * 0.9) {
      issues.push({
        type: 'warning',
        message: `Công suất tiêu thụ (${totalWattage}W) gần sát giới hạn PSU (${psuWattage}W)`,
      });
    }

    // Missing critical components
    const requiredTypes = ['CPU', 'MAINBOARD'];
    for (const required of requiredTypes) {
      if (!mapped.find((c) => c.componentType === required)) {
        issues.push({
          type: 'warning',
          message: `Thiếu linh kiện bắt buộc: ${required}`,
        });
      }
    }

    return {
      compatible: issues.filter((i) => i.type === 'error').length === 0,
      issues,
      totalWattage,
      totalPrice,
      psuWattage,
    };
  }

  async saveBuild(userId: string, dto: { name: string; componentIds: string[] }) {
    const result = await this.validateBuild(dto.componentIds);

    return this.prisma.savedBuild.create({
      data: {
        userId: BigInt(userId),
        name: dto.name,
        totalPrice: result.totalPrice,
        items: {
          create: await Promise.all(
            dto.componentIds.map(async (cid) => {
              const comp = await this.prisma.pcComponent.findUnique({
                where: { id: BigInt(cid) },
              });
              return {
                productId: comp!.productId,
                componentType: comp!.componentType,
              };
            }),
          ),
        },
      },
      include: { items: { include: { product: true } } },
    });
  }

  async getBuilds(userId: string) {
    const builds = await this.prisma.savedBuild.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { updatedAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, price: true, imageUrl: true },
            },
          },
        },
      },
    });

    return builds.map((b) => ({
      ...b,
      id: b.id.toString(),
      userId: b.userId.toString(),
      totalPrice: Number(b.totalPrice),
      items: b.items.map((i) => ({
        ...i,
        id: i.id.toString(),
        product: { ...i.product, id: i.product.id.toString(), price: Number(i.product.price) },
      })),
    }));
  }

  async getBuildDetail(buildId: string) {
    const build = await this.prisma.savedBuild.findUnique({
      where: { id: BigInt(buildId) },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, price: true, imageUrl: true },
            },
          },
        },
      },
    });
    if (!build) throw new NotFoundException('Build not found');

    return {
      ...build,
      id: build.id.toString(),
      userId: build.userId.toString(),
      totalPrice: Number(build.totalPrice),
      items: build.items.map((i) => ({
        ...i,
        id: i.id.toString(),
        product: { ...i.product, id: i.product.id.toString(), price: Number(i.product.price) },
      })),
    };
  }

  async deleteBuild(buildId: string) {
    return this.prisma.savedBuild.delete({ where: { id: BigInt(buildId) } });
  }
}
