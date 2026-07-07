import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeCategory } from '../../common/utils/serialize';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
    return categories.map(serializeCategory);
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return serializeCategory(category);
  }

  async create(dto: { name: string; slug: string; parentId?: string }) {
    const data = {
      name: dto.name,
      slug: dto.slug,
      parentId: dto.parentId ? BigInt(dto.parentId) : undefined,
    };
    const category = await this.prisma.category.create({ data });
    return serializeCategory(category);
  }

  async update(
    id: string,
    dto: { name?: string; slug?: string; parentId?: string | null },
  ) {
    const data: { name?: string; slug?: string; parentId?: bigint | null } = {
      ...dto,
      parentId:
        dto.parentId === undefined
          ? undefined
          : dto.parentId === null
            ? null
            : BigInt(dto.parentId),
    };
    const category = await this.prisma.category.update({
      where: { id: BigInt(id) },
      data,
    });
    return serializeCategory(category);
  }

  async remove(id: string) {
    const category = await this.prisma.category.delete({ where: { id: BigInt(id) } });
    return serializeCategory(category);
  }
}
