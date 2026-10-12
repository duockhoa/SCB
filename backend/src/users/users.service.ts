import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_MODULES, ALL_PERMISSION_CODES } from './rbac.constants';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.nguoi_dung.findMany({
      include: {
        vai_tro: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return users.map((u) => {
      let rolePerms: string[] = [];
      if (u.vai_tro?.quyen_han) {
        try {
          rolePerms = JSON.parse(u.vai_tro.quyen_han);
        } catch {
          rolePerms = [];
        }
      }
      let customPerms: string[] = [];
      if (u.quyen_rieng) {
        try {
          customPerms = JSON.parse(u.quyen_rieng);
        } catch {
          customPerms = [];
        }
      }
      return {
        ...u,
        rolePermissions: rolePerms,
        customPermissions: customPerms,
        effectivePermissions: Array.from(new Set([...rolePerms, ...customPerms])),
      };
    });
  }

  async getRoles() {
    const roles = await this.prisma.vai_tro.findMany({
      include: {
        _count: {
          select: { nguoi_dung: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return roles.map(r => {
      let parsedPerms: string[] = [];
      if (r.quyen_han) {
        try {
          parsedPerms = JSON.parse(r.quyen_han);
        } catch {
          parsedPerms = [];
        }
      }
      return {
        ...r,
        permissions: parsedPerms,
        userCount: r._count?.nguoi_dung || 0
      };
    });
  }

  async getPermissionsCatalog() {
    return PERMISSION_MODULES;
  }

  async createRole(data: { ma_vai_tro: string; ten_vai_tro: string; mo_ta?: string; quyen_han?: string[] }) {
    const code = data.ma_vai_tro.trim().toUpperCase();
    const existing = await this.prisma.vai_tro.findUnique({ where: { ma_vai_tro: code } });
    if (existing) {
      throw new ConflictException(`Mã vai trò ${code} đã tồn tại`);
    }

    const permsJson = data.quyen_han ? JSON.stringify(data.quyen_han) : null;

    return this.prisma.vai_tro.create({
      data: {
        ma_vai_tro: code,
        ten_vai_tro: data.ten_vai_tro.trim(),
        mo_ta: data.mo_ta?.trim() || null,
        quyen_han: permsJson,
      }
    });
  }

  async updateRoleDetail(id: number, data: { ten_vai_tro?: string; mo_ta?: string; quyen_han?: string[] }) {
    const role = await this.prisma.vai_tro.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');

    const updateData: any = {};
    if (data.ten_vai_tro !== undefined) updateData.ten_vai_tro = data.ten_vai_tro.trim();
    if (data.mo_ta !== undefined) updateData.mo_ta = data.mo_ta?.trim() || null;
    if (data.quyen_han !== undefined) {
      updateData.quyen_han = JSON.stringify(data.quyen_han);
    }

    return this.prisma.vai_tro.update({
      where: { id },
      data: updateData
    });
  }

  async deleteRole(id: number) {
    const role = await this.prisma.vai_tro.findUnique({
      where: { id },
      include: { _count: { select: { nguoi_dung: true } } }
    });
    if (!role) throw new NotFoundException('Không tìm thấy vai trò');

    if (role.ma_vai_tro === 'ADMIN') {
      throw new BadRequestException('Không thể xóa vai trò Quản trị viên ADMIN mặc định');
    }

    if (role._count?.nguoi_dung > 0) {
      throw new BadRequestException(`Không thể xóa vai trò này vì đang có ${role._count.nguoi_dung} người dùng được gán.`);
    }

    return this.prisma.vai_tro.delete({ where: { id } });
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

  async updateCustomPermissions(userId: number, permissions: string[]) {
    const user = await this.prisma.nguoi_dung.findUnique({
      where: { id: userId },
      include: { vai_tro: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const permsJson = permissions && permissions.length > 0 ? JSON.stringify(permissions) : null;

    const updated = await this.prisma.nguoi_dung.update({
      where: { id: userId },
      data: {
        quyen_rieng: permsJson,
      },
      include: {
        vai_tro: true,
      },
    });

    let rolePerms: string[] = [];
    if (updated.vai_tro?.quyen_han) {
      try {
        rolePerms = JSON.parse(updated.vai_tro.quyen_han);
      } catch {
        rolePerms = [];
      }
    }
    let customPerms: string[] = [];
    if (updated.quyen_rieng) {
      try {
        customPerms = JSON.parse(updated.quyen_rieng);
      } catch {
        customPerms = [];
      }
    }

    return {
      ...updated,
      rolePermissions: rolePerms,
      customPermissions: customPerms,
      effectivePermissions: Array.from(new Set([...rolePerms, ...customPerms])),
    };
  }
}
