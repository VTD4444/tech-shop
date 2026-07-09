import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serializeBrand } from '../../common/utils/serialize';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const brands = await this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
    return brands.map(serializeBrand);
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
