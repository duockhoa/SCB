import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HoSoService } from './ho-so.service';
import { hasRoutePermissionMatch } from '../users/rbac.constants';

describe('HoSoService dynamic fields', () => {
  const createMockHoSoDeps = () => {
    const tx: any = {
      ho_so_chung: {
        create: jest.fn(),
        update: jest.fn(),
      },
      ho_so_thuoc: {
        create: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      tai_lieu_ho_so: {
        create: jest.fn(),
        update: jest.fn(),
      },
      nhat_ky_ho_so: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma: any = {
      dm_loai_ho_so: {
        findUnique: jest.fn(),
      },
      dm_loai_tai_lieu: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      dm_tinh_trang: {
        findUnique: jest.fn(),
      },
      ho_so_chung: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      tai_lieu_ho_so: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb: (t: any) => any) => cb(tx)),
    };

    const eventEmitter: any = { emit: jest.fn() };
    return { prisma, tx, eventEmitter, service: new HoSoService(prisma, eventEmitter) };
  };

  it('stores thong_tin_rieng in du_lieu_dac_thu when creating a custom dynamic type', async () => {
    const { prisma, tx, service } = createMockHoSoDeps();
    prisma.ho_so_chung.findUnique.mockResolvedValue(null);
    prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
      id: 10,
      ma_loai: 'THUC_PHAM_THUONG',
      trang_thai: true,
      thoi_gian_canh_bao: 6,
      don_vi_canh_bao: 'THANG',
    });
    tx.ho_so_chung.create.mockResolvedValue({
      id: 99,
      ma_ho_so: 'HS-099',
      ten_san_pham: 'Trà thảo mộc',
    });

    await service.create(
      {
        ma_ho_so: 'HS-099',
        loai_ho_so_id: 10,
        ten_san_pham: 'Trà thảo mộc',
        cong_ty_id: 1,
        thong_tin_rieng: {
          so_tieu_chuan: 'TC-01',
          tai_lieu_url: '/uploads/tc01.pdf',
        },
      } as any,
      5,
    );

    expect(tx.ho_so_chung.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          du_lieu_dac_thu: {
            so_tieu_chuan: 'TC-01',
            tai_lieu_url: '/uploads/tc01.pdf',
          },
        }),
      }),
    );
    expect(tx.ho_so_thuoc.create).not.toHaveBeenCalled();
  });

  it('splits legacy fields and custom fields when creating a system type (THUOC)', async () => {
    const { prisma, tx, service } = createMockHoSoDeps();
    prisma.ho_so_chung.findUnique.mockResolvedValue(null);
    prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
      id: 1,
      ma_loai: 'THUOC',
      trang_thai: true,
      thoi_gian_canh_bao: 6,
      don_vi_canh_bao: 'THANG',
    });
    tx.ho_so_chung.create.mockResolvedValue({
      id: 100,
      ma_ho_so: 'HS-100',
      ten_san_pham: 'Paracetamol',
    });

    await service.create(
      {
        ma_ho_so: 'HS-100',
        loai_ho_so_id: 1,
        ten_san_pham: 'Paracetamol',
        cong_ty_id: 1,
        thong_tin_rieng: {
          hoat_chat_ham_luong: 'Paracetamol 500mg',
          ghi_chu_bo_sung: 'Hàng ưu tiên',
        },
      } as any,
      5,
    );

    expect(tx.ho_so_thuoc.create).toHaveBeenCalledWith({
      data: {
        ho_so_chung_id: 100,
        hoat_chat_ham_luong: 'Paracetamol 500mg',
      },
    });
    expect(tx.ho_so_chung.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          du_lieu_dac_thu: {
            ghi_chu_bo_sung: 'Hàng ưu tiên',
          },
        }),
      }),
    );
  });

  it('cleans up old legacy table and saves du_lieu_dac_thu when changing loai_ho_so_id on update', async () => {
    const { prisma, tx, service } = createMockHoSoDeps();
    prisma.ho_so_chung.findUnique.mockResolvedValue({
      id: 50,
      ma_ho_so: 'HS-050',
      loai_ho_so_id: 1,
      ngay_het_han: null,
      ap_dung_quy_dinh_tam_thoi: false,
      ngay_het_han_quy_dinh: null,
      tinh_trang_id: 2,
      tinh_trang: { ma_tinh_trang: 'DANG_XU_LY' },
      loai_ho_so: { id: 1, ma_loai: 'THUOC', trang_thai: true },
      ho_so_thuoc: { hoat_chat_nong_do: 'Old' },
      nhat_ky: [],
    });
    prisma.dm_loai_ho_so.findUnique.mockResolvedValue({
      id: 10,
      ma_loai: 'THUC_PHAM_THUONG',
      trang_thai: true,
      thoi_gian_canh_bao: 6,
      don_vi_canh_bao: 'THANG',
    });
    tx.ho_so_chung.update.mockResolvedValue({
      id: 50,
      ma_ho_so: 'HS-050',
    });

    await service.update(
      50,
      {
        loai_ho_so_id: 10,
        thong_tin_rieng: { so_tieu_chuan: 'TC-99' },
      } as any,
      5,
    );

    expect(tx.ho_so_thuoc.deleteMany).toHaveBeenCalledWith({ where: { ho_so_chung_id: 50 } });
    expect(tx.ho_so_chung.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loai_ho_so_id: 10,
          du_lieu_dac_thu: { so_tieu_chuan: 'TC-99' },
        }),
      }),
    );

    // Ensure JsonNull is untouched when thong_tin_rieng is omitted and loai changes
    tx.ho_so_chung.update.mockClear();
    await service.update(50, { loai_ho_so_id: 10 } as any, 5);
    expect(tx.ho_so_chung.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          du_lieu_dac_thu: Prisma.JsonNull,
        }),
      }),
    );
  });

  it('adds tai_lieu_ho_so with selected loai_tai_lieu_id and dynamic fields', async () => {
    const { prisma, tx, service } = createMockHoSoDeps();
    prisma.ho_so_chung.findUnique.mockResolvedValue({ id: 50, loai_ho_so_id: 1 });
    prisma.dm_loai_tai_lieu.findUnique.mockResolvedValue({
      id: 4,
      ma_loai_tai_lieu: 'CONG_VAN',
      ten_loai_tai_lieu: 'Công văn',
      trang_thai: true,
      ap_dung_tat_ca: false,
      loai_ho_so_links: [{ loai_ho_so_id: 1 }],
    });
    tx.tai_lieu_ho_so.create.mockImplementation(async ({ data }: any) => ({ id: 201, ...data }));

    await service.addTaiLieu(
      50,
      {
        loai_tai_lieu_id: 4,
        ten_tai_lieu: 'Công văn duyệt nhãn',
        duong_dan_url: '/uploads/cv.pdf',
        ngay_hieu_luc: '2026-11-01',
        du_lieu_dac_thu: { so_cong_van: '123/QLD', co_quan: 'Cục QLD' },
      },
      9,
    );

    expect(tx.tai_lieu_ho_so.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ho_so_chung_id: 50,
          loai_tai_lieu_id: 4,
          ten_tai_lieu: 'Công văn duyệt nhãn',
          du_lieu_dac_thu: { so_cong_van: '123/QLD', co_quan: 'Cục QLD' },
        }),
      }),
    );
  });

  it('rejects addTaiLieu when loai_tai_lieu does not apply to the dossier type', async () => {
    const { prisma, service } = createMockHoSoDeps();
    prisma.ho_so_chung.findUnique.mockResolvedValue({ id: 50, loai_ho_so_id: 1 });
    prisma.dm_loai_tai_lieu.findUnique.mockResolvedValue({
      id: 7,
      ma_loai_tai_lieu: 'DOC_TBYT',
      ten_loai_tai_lieu: 'Tài liệu riêng TBYT',
      trang_thai: true,
      ap_dung_tat_ca: false,
      loai_ho_so_links: [{ loai_ho_so_id: 3 }],
    });

    await expect(
      service.addTaiLieu(50, {
        loai_tai_lieu_id: 7,
        ten_tai_lieu: 'Tài liệu sai loại',
        duong_dan_url: '/uploads/x.pdf',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates and replaces tai_lieu metadata and du_lieu_dac_thu', async () => {
    const { prisma, tx, service } = createMockHoSoDeps();
    prisma.ho_so_chung.findUnique.mockResolvedValue({ id: 50, loai_ho_so_id: 1 });
    prisma.tai_lieu_ho_so.findUnique.mockResolvedValue({
      id: 201,
      ho_so_chung_id: 50,
      loai_tai_lieu_id: 4,
      ten_tai_lieu: 'Công văn cũ',
      so_phien_ban: 1,
      ghi_chu: null,
      ngay_het_hieu_luc: null,
      du_lieu_dac_thu: { so_cong_van: '123/QLD' },
    });
    tx.tai_lieu_ho_so.update.mockResolvedValue({ id: 201, ten_tai_lieu: 'Công văn mới' });
    tx.tai_lieu_ho_so.create.mockImplementation(async ({ data }: any) => ({ id: 202, ...data }));

    await service.updateTaiLieu(
      50,
      201,
      { ten_tai_lieu: 'Công văn mới', du_lieu_dac_thu: { so_cong_van: '456/QLD' } },
      9,
    );
    expect(tx.tai_lieu_ho_so.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 201 },
        data: expect.objectContaining({
          ten_tai_lieu: 'Công văn mới',
          du_lieu_dac_thu: { so_cong_van: '456/QLD' },
        }),
      }),
    );

    await service.replaceTaiLieu(
      50,
      201,
      { duong_dan_url: '/uploads/cv-v2.pdf', du_lieu_dac_thu: { so_cong_van: '789/QLD' } },
      9,
    );
    expect(tx.tai_lieu_ho_so.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          so_phien_ban: 2,
          loai_tai_lieu_id: 4,
          du_lieu_dac_thu: { so_cong_van: '789/QLD' },
        }),
      }),
    );
  });

  it('enforces per-document-group permissions for viewing, uploading, replacing, and deleting', async () => {
    const { prisma, tx, service } = createMockHoSoDeps();
    const scopedUser = {
      userId: 12,
      username: 'nhanvien',
      role: 'NV_DANG_KY',
      isAdmin: false,
      permissions: [
        'HOSO_VIEW',
        'HOSO_TAI_LIEU_GROUP:NHAN_SP:VIEW',
        'HOSO_TAI_LIEU_GROUP:NHAN_SP:UPLOAD',
      ],
    };

    expect(hasRoutePermissionMatch(scopedUser.permissions, 'HOSO_TAI_LIEU_VIEW')).toBe(true);
    expect(hasRoutePermissionMatch(scopedUser.permissions, 'HOSO_TAI_LIEU_UPLOAD')).toBe(true);
    expect(hasRoutePermissionMatch(scopedUser.permissions, 'HOSO_TAI_LIEU_REPLACE')).toBe(false);
    expect(hasRoutePermissionMatch(scopedUser.permissions, 'HOSO_TAI_LIEU_DELETE')).toBe(false);

    prisma.ho_so_chung.findUnique.mockResolvedValue({
      id: 50,
      loai_ho_so_id: 1,
      tai_lieu: [
        { id: 1, ten_tai_lieu: 'Nhãn hộp', loai_tai_lieu: { ma_loai_tai_lieu: 'NHAN_SP' } },
        { id: 2, ten_tai_lieu: 'Công văn mật', loai_tai_lieu: { ma_loai_tai_lieu: 'CONG_VAN' } },
      ],
    });

    const detail = await service.findOne(50, scopedUser);
    expect(detail.tai_lieu).toHaveLength(1);
    expect(detail.tai_lieu[0].id).toBe(1);

    prisma.dm_loai_tai_lieu.findUnique.mockResolvedValueOnce({
      id: 9,
      ma_loai_tai_lieu: 'CONG_VAN',
      ten_loai_tai_lieu: 'Công văn',
      trang_thai: true,
      ap_dung_tat_ca: true,
    });
    await expect(
      service.addTaiLieu(
        50,
        { loai_tai_lieu_id: 9, ten_tai_lieu: 'CV mới', duong_dan_url: '/uploads/cv.pdf' },
        12,
        scopedUser,
      ),
    ).rejects.toThrow(ForbiddenException);

    prisma.dm_loai_tai_lieu.findUnique.mockResolvedValueOnce({
      id: 8,
      ma_loai_tai_lieu: 'NHAN_SP',
      ten_loai_tai_lieu: 'Nhãn sản phẩm',
      trang_thai: true,
      ap_dung_tat_ca: true,
    });
    tx.tai_lieu_ho_so.create.mockResolvedValueOnce({
      id: 300,
      ten_tai_lieu: 'Nhãn v1',
      loai_tai_lieu: { ma_loai_tai_lieu: 'NHAN_SP', ten_loai_tai_lieu: 'Nhãn sản phẩm' },
    });
    await expect(
      service.addTaiLieu(
        50,
        { loai_tai_lieu_id: 8, ten_tai_lieu: 'Nhãn v1', duong_dan_url: '/uploads/nhan.pdf' },
        12,
        scopedUser,
      ),
    ).resolves.toMatchObject({ id: 300 });

    prisma.tai_lieu_ho_so.findUnique.mockResolvedValueOnce({
      id: 300,
      ho_so_chung_id: 50,
      loai_tai_lieu_id: 8,
      loai_tai_lieu: { ma_loai_tai_lieu: 'NHAN_SP', ten_loai_tai_lieu: 'Nhãn sản phẩm' },
    });
    await expect(
      service.replaceTaiLieu(
        50,
        300,
        { duong_dan_url: '/uploads/nhan-v2.pdf' },
        12,
        scopedUser,
      ),
    ).rejects.toThrow(ForbiddenException);

    prisma.tai_lieu_ho_so.findUnique.mockResolvedValueOnce({
      id: 300,
      ho_so_chung_id: 50,
      loai_tai_lieu_id: 8,
      loai_tai_lieu: { ma_loai_tai_lieu: 'NHAN_SP', ten_loai_tai_lieu: 'Nhãn sản phẩm' },
    });
    await expect(service.deleteTaiLieu(50, 300, 12, scopedUser)).rejects.toThrow(ForbiddenException);
  });
});
