import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serializeCategory } from '../../common/utils/serialize';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { page?: number; limit?: number; search?: string }) {
    const q = query?.search?.trim();
    const where: Prisma.CategoryWhereInput = { parentId: null };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const paginate =
      query?.page != null || query?.limit != null || Boolean(q);

    if (!paginate) {
      const categories = await this.prisma.category.findMany({
        include: { children: true },
        where: { parentId: null },
        orderBy: { name: 'asc' },
      });
      return categories.map(serializeCategory);
    }

    const page = Number(query?.page) || 1;
    const limit = Math.min(Number(query?.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        include: { children: true },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: data.map(serializeCategory),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return serializeCategory(category);
  }

  private async validateParentId(parentId: string | undefined, categoryId?: bigint) {
    if (!parentId) return undefined;
    if (categoryId && BigInt(parentId) === categoryId) {
      throw new BadRequestException('Category cannot be its own parent');
    }
    const parent = await this.prisma.category.findUnique({ where: { id: BigInt(parentId) } });
    if (!parent) throw new BadRequestException('Parent category not found');
    return parent.id;
  }

  async create(dto: { name: string; slug: string; parentId?: string }) {
    const parentId = await this.validateParentId(dto.parentId);
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId,
      },
    });
    return serializeCategory(category);
  }

  async update(
    id: string,
    dto: { name?: string; slug?: string; parentId?: string | null },
  ) {
    const categoryId = BigInt(id);
    const existing = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) throw new NotFoundException('Category not found');

    const data: { name?: string; slug?: string; parentId?: bigint | null } = {
      name: dto.name,
      slug: dto.slug,
    };

    if (dto.parentId !== undefined) {
      if (dto.parentId === null) {
        data.parentId = null;
      } else {
        data.parentId = await this.validateParentId(dto.parentId, categoryId);
      }
    }

    const category = await this.prisma.category.update({
      where: { id: categoryId },
      data,
    });
    return serializeCategory(category);
  }

  async remove(id: string) {
    const categoryId = BigInt(id);
    const existing = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) throw new NotFoundException('Category not found');

    const [childCount, productCount] = await Promise.all([
      this.prisma.category.count({ where: { parentId: categoryId } }),
      this.prisma.product.count({ where: { categoryId } }),
    ]);

    if (childCount > 0) {
      throw new BadRequestException('Cannot delete category with child categories');
    }
    if (productCount > 0) {
      throw new BadRequestException('Cannot delete category linked to products');
    }

    const category = await this.prisma.category.delete({ where: { id: categoryId } });
    return serializeCategory(category);
  }
}
