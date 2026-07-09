import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toId } from '../../common/utils/serialize';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapAddress(address: {
    id: bigint;
    userId: bigint;
    receiverName: string;
    phone: string;
    addressLine: string;
    ward: string | null;
    district: string | null;
    city: string | null;
    isDefault: boolean;
    createdAt: Date;
  }) {
    return {
      id: toId(address.id)!,
      userId: toId(address.userId)!,
      receiverName: address.receiverName,
      phone: address.phone,
      addressLine: address.addressLine,
      ward: address.ward,
      district: address.district,
      city: address.city,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { ...user, id: user.id.toString() };
  }

  async updateProfile(
    userId: string,
    dto: { fullName?: string; email?: string; phone?: string },
  ) {
    const id = BigInt(userId);

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const conflict = await this.prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Email already exists');
      dto.email = email;
    }

    if (dto.phone) {
      const phone = dto.phone.trim();
      const conflict = await this.prisma.user.findFirst({
        where: { phone, NOT: { id } },
      });
      if (conflict) throw new ConflictException('Phone number already exists');
      dto.phone = phone;
    }

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
      },
    });
    return { ...user, id: user.id.toString() };
  }

  async getAddresses(userId: string) {
    const addresses = await this.prisma.userAddress.findMany({
      where: { userId: BigInt(userId) },
      orderBy: { isDefault: 'desc' },
    });
    return addresses.map((address) => this.mapAddress(address));
  }

  async createAddress(userId: string, dto: any) {
    const data = { ...dto, userId: BigInt(userId) };

    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId: BigInt(userId) },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.userAddress.create({ data });
    return this.mapAddress(created);
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

    const updated = await this.prisma.userAddress.update({
      where: { id: BigInt(addressId) },
      data: dto,
    });
    return this.mapAddress(updated);
  }

  async deleteAddress(userId: string, addressId: string) {
    const addr = await this.prisma.userAddress.findFirst({
      where: { id: BigInt(addressId), userId: BigInt(userId) },
    });
    if (!addr) throw new NotFoundException('Address not found');

    const deleted = await this.prisma.userAddress.delete({
      where: { id: BigInt(addressId) },
    });
    return this.mapAddress(deleted);
  }
}
