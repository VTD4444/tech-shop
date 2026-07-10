import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializePcComponent, serializeSavedBuild } from '../../common/utils/serialize';

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

const productSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  imageUrl: true,
  description: true,
  brand: { select: { name: true, slug: true } },
} as const;

export type PcComponentListQuery = {
  type?: string;
  selectedIds?: string[];
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
};

@Injectable()
export class PcBuilderService {
  constructor(private prisma: PrismaService) {}

  async getComponents(query: PcComponentListQuery = {}) {
    const { type, selectedIds, search, brand, minPrice, maxPrice, sort } = query;

    const productWhere: Record<string, unknown> = { status: 'active' };
    if (search?.trim()) {
      productWhere.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    if (brand?.trim()) {
      productWhere.brand = { slug: brand.trim() };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (minPrice !== undefined) priceFilter.gte = Number(minPrice);
      if (maxPrice !== undefined) priceFilter.lte = Number(maxPrice);
      productWhere.price = priceFilter;
    }

    const where: Record<string, unknown> = { product: productWhere };
    if (type) where.componentType = type.toUpperCase();

    let orderBy: Record<string, unknown> = { product: { name: 'asc' } };
    if (sort === 'price_asc') orderBy = { product: { price: 'asc' } };
    else if (sort === 'price_desc') orderBy = { product: { price: 'desc' } };
    else if (sort === 'name_asc') orderBy = { product: { name: 'asc' } };
    else if (sort === 'created_at') orderBy = { product: { createdAt: 'desc' } };

    const components = await this.prisma.pcComponent.findMany({
      where,
      include: { product: { select: productSelect } },
      orderBy,
    });

    const serialized = components.map(serializePcComponent);

    if (!selectedIds?.length) {
      return serialized.map((c) => ({
        ...c,
        compatible: true,
        incompatibilityReasons: [] as string[],
      }));
    }

    const selected = selectedIds.filter(Boolean);
    const annotated = await Promise.all(
      serialized.map(async (comp) => {
        const buildIds = [...selected, comp.id];
        try {
          const validation = await this.validateBuild(buildIds);
          const errors = validation.issues
            .filter((i) => i.type === 'error')
            .map((i) => i.message);
          return {
            ...comp,
            compatible: errors.length === 0,
            incompatibilityReasons: errors,
          };
        } catch {
          return {
            ...comp,
            compatible: false,
            incompatibilityReasons: ['Không thể kiểm tra tương thích'],
          };
        }
      }),
    );

    return annotated;
  }

  async getComponentByProductSlug(slug: string) {
    const component = await this.prisma.pcComponent.findFirst({
      where: { product: { slug, status: 'active', isPcComponent: true } },
      include: { product: { select: productSelect } },
    });
    if (!component) {
      throw new NotFoundException('Product is not an available PC component');
    }
    return serializePcComponent(component);
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

    const mapped: BuildComponent[] = components.map((c) => serializePcComponent(c));

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

    if (cpu && mb && cpu.socket && mb.socket && cpu.socket !== mb.socket) {
      issues.push({
        type: 'error',
        message: `CPU socket (${cpu.socket}) không tương thích với Mainboard socket (${mb.socket})`,
        componentA: cpu.product?.name,
        componentB: mb.product?.name,
      });
    }

    if (ram && mb && ram.ramGeneration && mb.ramGeneration && ram.ramGeneration !== mb.ramGeneration) {
      issues.push({
        type: 'error',
        message: `RAM ${ram.ramGeneration} không tương thích với Mainboard ${mb.ramGeneration}`,
        componentA: ram.product?.name,
        componentB: mb.product?.name,
      });
    }

    if (ram && mb && mb.maxRamCapacity && ram.ramCapacity && ram.ramCapacity > mb.maxRamCapacity) {
      issues.push({
        type: 'error',
        message: `RAM dung lượng ${ram.ramCapacity}GB vượt quá hỗ trợ tối đa của Mainboard (${mb.maxRamCapacity}GB)`,
      });
    }

    if (gpu && pcCase && gpu.gpuLengthMm && pcCase.maxGpuLengthMm && gpu.gpuLengthMm > pcCase.maxGpuLengthMm) {
      issues.push({
        type: 'error',
        message: `GPU dài ${gpu.gpuLengthMm}mm không vừa Case (tối đa ${pcCase.maxGpuLengthMm}mm)`,
        componentA: gpu.product?.name,
        componentB: pcCase.product?.name,
      });
    }

    if (cooler && pcCase && cooler.cpuCoolerHeightMm && pcCase.maxCpuCoolerHeightMm && cooler.cpuCoolerHeightMm > pcCase.maxCpuCoolerHeightMm) {
      issues.push({
        type: 'error',
        message: `Tản nhiệt cao ${cooler.cpuCoolerHeightMm}mm không vừa Case (tối đa ${pcCase.maxCpuCoolerHeightMm}mm)`,
        componentA: cooler.product?.name,
        componentB: pcCase.product?.name,
      });
    }

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

    if (psu && psuWattage != null && totalWattage > psuWattage) {
      issues.push({
        type: 'error',
        message: `Tổng công suất ${totalWattage}W vượt quá PSU ${psuWattage}W`,
      });
    } else if (psu && psuWattage != null && totalWattage > psuWattage * 0.9) {
      issues.push({
        type: 'warning',
        message: `Công suất tiêu thụ (${totalWattage}W) gần sát giới hạn PSU (${psuWattage}W)`,
      });
    }

    const recommendedTypes = ['CPU', 'MAINBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE'];
    for (const required of recommendedTypes) {
      if (!mapped.find((c) => c.componentType === required)) {
        issues.push({
          type: 'warning',
          message: `Thiếu linh kiện khuyến nghị: ${required}`,
        });
      }
    }

    if (!cpu || !mb) {
      issues.push({
        type: 'error',
        message: 'Build cần có CPU và Mainboard',
      });
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
    if (!result.compatible) {
      throw new ForbiddenException('Build is not compatible');
    }

    const build = await this.prisma.savedBuild.create({
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
              if (!comp) throw new NotFoundException('Component not found');
              return {
                productId: comp.productId,
                componentType: comp.componentType,
              };
            }),
          ),
        },
      },
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

    return serializeSavedBuild(build);
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

    return builds.map(serializeSavedBuild);
  }

  async getBuildDetail(buildId: string, userId: string) {
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
    if (build.userId.toString() !== userId) {
      throw new ForbiddenException('Not your build');
    }

    return serializeSavedBuild(build);
  }

  async deleteBuild(buildId: string, userId: string) {
    const build = await this.prisma.savedBuild.findUnique({
      where: { id: BigInt(buildId) },
    });
    if (!build) throw new NotFoundException('Build not found');
    if (build.userId.toString() !== userId) {
      throw new ForbiddenException('Not your build');
    }
    await this.prisma.savedBuild.delete({ where: { id: BigInt(buildId) } });
    return { deleted: true };
  }
}
