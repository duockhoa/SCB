import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.nguoi_dung.findMany({
      include: {
        vai_tro: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  async getRoles() {
    return this.prisma.vai_tro.findMany();
  }

  async updateRole(userId: number, roleId: number | null) {
    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.prisma.nguoi_dung.update({
      where: { id: userId },
      data: {
        vai_tro_id: roleId,
      },
      include: {
        vai_tro: true,
      },
    });
  }
}
