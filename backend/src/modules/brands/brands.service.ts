import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serializeBrand } from '../../common/utils/serialize';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { page?: number; limit?: number; search?: string }) {
    const q = query?.search?.trim();
    const where: Prisma.BrandWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const paginate =
      query?.page != null || query?.limit != null || Boolean(q);

    if (!paginate) {
      const brands = await this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
      return brands.map(serializeBrand);
    }

    const page = Number(query?.page) || 1;
    const limit = Math.min(Number(query?.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      data: data.map(serializeBrand),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundException('Brand not found');
    return serializeBrand(brand);
  }

  async create(dto: { name: string; slug: string }) {
    const brand = await this.prisma.brand.create({ data: dto });
    return serializeBrand(brand);
  }

  async update(id: string, dto: { name?: string; slug?: string }) {
    const brandId = BigInt(id);
    const existing = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!existing) throw new NotFoundException('Brand not found');

    const brand = await this.prisma.brand.update({
      where: { id: brandId },
      data: dto,
    });
    return serializeBrand(brand);
  }

  async remove(id: string) {
    const brandId = BigInt(id);
    const existing = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!existing) throw new NotFoundException('Brand not found');

    const productCount = await this.prisma.product.count({ where: { brandId } });
    if (productCount > 0) {
      throw new BadRequestException('Cannot delete brand linked to products');
    }

    const brand = await this.prisma.brand.delete({ where: { id: brandId } });
    return serializeBrand(brand);
  }
}
