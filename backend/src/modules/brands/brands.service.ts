import { Injectable } from '@nestjs/common';
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
    return brand ? serializeBrand(brand) : null;
  }

  async create(dto: { name: string; slug: string }) {
    const brand = await this.prisma.brand.create({ data: dto });
    return serializeBrand(brand);
  }

  async update(id: string, dto: { name?: string; slug?: string }) {
    const brand = await this.prisma.brand.update({
      where: { id: BigInt(id) },
      data: dto,
    });
    return serializeBrand(brand);
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.delete({ where: { id: BigInt(id) } });
    return serializeBrand(brand);
  }
}
