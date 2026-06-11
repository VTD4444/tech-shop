import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { ...user, id: user.id.toString() };
  }

  async updateProfile(userId: string, dto: { username?: string; email?: string }) {
    const user = await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: dto,
      select: { id: true, username: true, email: true, role: true },
    });
    return { ...user, id: user.id.toString() };
  }

  async getAddresses(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(userId: string, dto: any) {
    const data = { ...dto, userId: BigInt(userId) };

    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId: BigInt(userId) },
        data: { isDefault: false },
      });
    }

    return this.prisma.userAddress.create({ data });
  }

  async updateAddress(userId: string, addressId: string, dto: any) {
    const addr = await this.prisma.userAddress.findFirst({
      where: { id: BigInt(addressId), userId: BigInt(userId) },
    });
    if (!addr) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId: BigInt(userId) },
        data: { isDefault: false },
      });
    }

    return this.prisma.userAddress.update({
      where: { id: BigInt(addressId) },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const addr = await this.prisma.userAddress.findFirst({
      where: { id: BigInt(addressId), userId: BigInt(userId) },
    });
    if (!addr) throw new NotFoundException('Address not found');

    return this.prisma.userAddress.delete({
      where: { id: BigInt(addressId) },
    });
  }
}
