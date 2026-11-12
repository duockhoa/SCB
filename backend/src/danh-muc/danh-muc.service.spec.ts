import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';

describe('DanhMucService', () => {
  const createMockPrisma = () => ({
    dm_loai_ho_so: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dm_tinh_trang: {
      findMany: jest.fn(),
    },
    ho_so_chung: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  });

  describe('createLoaiHoSo', () => {
    it('normalizes ma_loai, assigns next thu_tu, and formats response', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue(null);
      prisma.dm_loai_ho_so.aggregate.mockResolvedValue({ _max: { thu_tu: 6 } });
      prisma.dm_loai_ho_so.create.mockImplementation(async ({ data }: any) => ({
        id: 10,
        ...data,
        _count: { ho_so_chung: 0 },
      }));

      const service = new DanhMucService(prisma as any);
      const created = await service.createLoaiHoSo({
        ma_loai: 'thuc_pham_thuong',
        ten_loai: '  Thực phẩm thường  ',
        mau_sac: 'cyan',
        cau_hinh_truong: [
          {
            key: 'so_tieu_chuan',
            label: 'Số tiêu chuẩn',
            type: 'text',
            required: true,
          },
        ],
      });

      expect(created.ma_loai).toBe('THUC_PHAM_THUONG');
      expect(created.ten_loai).toBe('Thực phẩm thường');
      expect(created.thu_tu).toBe(7);
      expect(created.is_system).toBe(false);
      expect(created.so_luong_ho_so).toBe(0);
      expect(prisma.dm_loai_ho_so.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ma_loai: 'THUC_PHAM_THUONG',
            mau_sac: 'cyan',
            thu_tu: 7,
            cau_hinh_truong: [
              expect.objectContaining({
                key: 'so_tieu_chuan',
                label: 'Số tiêu chuẩn',
                type: 'text',
                required: true,
                colSpan: 12,
              }),
            ],
          }),
        }),
      );
    });

    it('throws ConflictException when ma_loai already exists', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({ id: 1, ma_loai: 'THUOC' });

      const service = new DanhMucService(prisma as any);
      await expect(
        service.createLoaiHoSo({ ma_loai: 'thuoc', ten_loai: 'Thuốc 2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException on duplicate custom field keys', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue(null);

      const service = new DanhMucService(prisma as any);
      await expect(
        service.createLoaiHoSo({
          ma_loai: 'LOAI_MOI',
          ten_loai: 'Loại mới',
          cau_hinh_truong: [
            { key: 'so_gp', label: 'Số GP 1', type: 'text' },
            { key: 'so_gp', label: 'Số GP 2', type: 'text' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when select field has no options', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue(null);

      const service = new DanhMucService(prisma as any);
      await expect(
        service.createLoaiHoSo({
          ma_loai: 'LOAI_MOI',
          ten_loai: 'Loại mới',
          cau_hinh_truong: [
            { key: 'phan_nhom', label: 'Phân nhóm', type: 'select', options: [] },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateLoaiHoSo', () => {
    it('allows renaming and updating custom fields for a system type when ma_loai is unchanged', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
        id: 1,
        ma_loai: 'THUOC',
        ten_loai: 'Thuốc',
        _count: { ho_so_chung: 12 },
      });
      prisma.dm_loai_ho_so.update.mockImplementation(async ({ data }: any) => ({
        id: 1,
        ma_loai: 'THUOC',
        ...data,
        _count: { ho_so_chung: 12 },
      }));

      const service = new DanhMucService(prisma as any);
      const updated = await service.updateLoaiHoSo(1, {
        ma_loai: 'THUOC',
        ten_loai: 'Thuốc & Dược phẩm',
        mau_sac: 'blue',
        cau_hinh_truong: [{ key: 'ghi_chu_rieng', label: 'Ghi chú riêng', type: 'textarea' }],
      });

      expect(updated.ten_loai).toBe('Thuốc & Dược phẩm');
      expect(updated.is_system).toBe(true);
      expect(updated.so_luong_ho_so).toBe(12);
    });

    it('blocks changing ma_loai of a system type', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
        id: 1,
        ma_loai: 'THUOC',
        _count: { ho_so_chung: 0 },
      });

      const service = new DanhMucService(prisma as any);
      await expect(
        service.updateLoaiHoSo(1, { ma_loai: 'DUOC_PHAM' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks changing ma_loai of a custom type that already has dossiers', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
        id: 8,
        ma_loai: 'CUSTOM_TYPE',
        _count: { ho_so_chung: 3 },
      });

      const service = new DanhMucService(prisma as any);
      await expect(
        service.updateLoaiHoSo(8, { ma_loai: 'CUSTOM_TYPE_V2' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when type does not exist', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue(null);

      const service = new DanhMucService(prisma as any);
      await expect(service.updateLoaiHoSo(999, { ten_loai: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLoaiHoSo', () => {
    it('blocks deleting a system type', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
        id: 1,
        ma_loai: 'MY_PHAM',
        _count: { ho_so_chung: 0 },
      });

      const service = new DanhMucService(prisma as any);
      await expect(service.deleteLoaiHoSo(1)).rejects.toThrow(BadRequestException);
      expect(prisma.dm_loai_ho_so.delete).not.toHaveBeenCalled();
    });

    it('blocks deleting a custom type that still has dossiers', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
        id: 9,
        ma_loai: 'CUSTOM_A',
        _count: { ho_so_chung: 4 },
      });

      const service = new DanhMucService(prisma as any);
      await expect(service.deleteLoaiHoSo(9)).rejects.toThrow(ConflictException);
      expect(prisma.dm_loai_ho_so.delete).not.toHaveBeenCalled();
    });

    it('deletes an unused custom type', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
        id: 9,
        ma_loai: 'CUSTOM_A',
        _count: { ho_so_chung: 0 },
      });
      prisma.dm_loai_ho_so.delete.mockResolvedValue({ id: 9 });

      const service = new DanhMucService(prisma as any);
      const res = await service.deleteLoaiHoSo(9);

      expect(prisma.dm_loai_ho_so.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(res.message).toContain('Xóa loại hồ sơ thành công');
    });
  });
});

