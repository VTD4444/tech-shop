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

  async create(dto: { name: string; slug: string; parentId?: bigint }) {
    const category = await this.prisma.category.create({ data: dto });
    return serializeCategory(category);
  }

  async update(id: string, dto: { name?: string; slug?: string; parentId?: bigint | null }) {
    const category = await this.prisma.category.update({
      where: { id: BigInt(id) },
      data: dto,
    });
    return serializeCategory(category);
  }

  async remove(id: string) {
    const category = await this.prisma.category.delete({ where: { id: BigInt(id) } });
    return serializeCategory(category);
  }
}
