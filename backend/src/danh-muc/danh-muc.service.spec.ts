import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DanhMucService } from './danh-muc.service';

describe('DanhMucService', () => {
  const createMockPrisma = () => {
    const prisma: any = {
      dm_loai_ho_so: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      dm_loai_tai_lieu: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      dm_loai_ho_so_tai_lieu: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      dm_tinh_trang: {
        findMany: jest.fn(),
      },
      ho_so_chung: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: any) => any) => cb(prisma)),
    };
    return prisma;
  };

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

  describe('loai_tai_lieu CRUD & scoping', () => {
    it('filters active document types by loaiHoSoId', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_tai_lieu.findMany.mockResolvedValue([
        {
          id: 2,
          ma_loai_tai_lieu: 'NHAN',
          ten_loai_tai_lieu: 'Nhãn sản phẩm',
          ap_dung_tat_ca: false,
          _count: { tai_lieu_ho_so: 3 },
          loai_ho_so_links: [
            { loai_ho_so_id: 1, loai_ho_so: { id: 1, ma_loai: 'THUOC', ten_loai: 'Thuốc', mau_sac: 'red' } },
          ],
        },
      ]);

      const service = new DanhMucService(prisma as any);
      const list = await service.getLoaiTaiLieu(false, 1);

      expect(prisma.dm_loai_tai_lieu.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            trang_thai: true,
            OR: [{ ap_dung_tat_ca: true }, { loai_ho_so_links: { some: { loai_ho_so_id: 1 } } }],
          },
        }),
      );
      expect(list[0].loai_ho_so_ids).toEqual([1]);
      expect(list[0].so_luong_tai_lieu).toBe(3);
    });

    it('creates a scoped loai_tai_lieu with custom fields', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_tai_lieu.findUnique.mockResolvedValue(null);
      prisma.dm_loai_ho_so.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prisma.dm_loai_tai_lieu.aggregate.mockResolvedValue({ _max: { thu_tu: 9 } });
      prisma.dm_loai_tai_lieu.create.mockImplementation(async ({ data }: any) => ({
        id: 11,
        ...data,
        _count: { tai_lieu_ho_so: 0 },
        loai_ho_so_links: [
          { loai_ho_so_id: 1, loai_ho_so: { id: 1, ma_loai: 'THUOC', ten_loai: 'Thuốc', mau_sac: 'red' } },
          { loai_ho_so_id: 2, loai_ho_so: { id: 2, ma_loai: 'MY_PHAM', ten_loai: 'Mỹ phẩm', mau_sac: 'pink' } },
        ],
      }));

      const service = new DanhMucService(prisma as any);
      const created = await service.createLoaiTaiLieu({
        ma_loai_tai_lieu: 'phieu_kiem_nghiem',
        ten_loai_tai_lieu: 'Phiếu kiểm nghiệm',
        ap_dung_tat_ca: false,
        loai_ho_so_ids: [1, 2],
        cau_hinh_truong: [{ key: 'so_phieu', label: 'Số phiếu', type: 'text', required: true }],
      });

      expect(created.ma_loai_tai_lieu).toBe('PHIEU_KIEM_NGHIEM');
      expect(created.thu_tu).toBe(10);
      expect(created.loai_ho_so_ids).toEqual([1, 2]);
      expect(created.is_system).toBe(false);
    });

    it('rejects createLoaiTaiLieu when ap_dung_tat_ca is false without loai_ho_so_ids', async () => {
      const prisma = createMockPrisma();
      prisma.dm_loai_tai_lieu.findUnique.mockResolvedValue(null);

      const service = new DanhMucService(prisma as any);
      await expect(
        service.createLoaiTaiLieu({
          ma_loai_tai_lieu: 'PHIEU_KN',
          ten_loai_tai_lieu: 'Phiếu KN',
          ap_dung_tat_ca: false,
          loai_ho_so_ids: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks deleting KHAC or in-use document type, deletes unused custom type', async () => {
      const prisma = createMockPrisma();
      const service = new DanhMucService(prisma as any);

      prisma.dm_loai_tai_lieu.findUnique.mockResolvedValueOnce({
        id: 9,
        ma_loai_tai_lieu: 'KHAC',
        _count: { tai_lieu_ho_so: 0 },
      });
      await expect(service.deleteLoaiTaiLieu(9)).rejects.toThrow(BadRequestException);

      prisma.dm_loai_tai_lieu.findUnique.mockResolvedValueOnce({
        id: 12,
        ma_loai_tai_lieu: 'CUSTOM_DOC',
        _count: { tai_lieu_ho_so: 2 },
      });
      await expect(service.deleteLoaiTaiLieu(12)).rejects.toThrow(ConflictException);

      prisma.dm_loai_tai_lieu.findUnique.mockResolvedValueOnce({
        id: 12,
        ma_loai_tai_lieu: 'CUSTOM_DOC',
        _count: { tai_lieu_ho_so: 0 },
      });
      prisma.dm_loai_tai_lieu.delete.mockResolvedValue({ id: 12 });
      const res = await service.deleteLoaiTaiLieu(12);
      expect(res.message).toContain('Xóa loại tài liệu thành công');
    });
  });
});

