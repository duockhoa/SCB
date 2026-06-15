import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed dm_loai_ho_so
  const loaiHoSoList = [
    { ma_loai: 'THUOC', ten_loai: 'Hồ sơ thuốc', thu_tu: 1 },
    { ma_loai: 'MY_PHAM', ten_loai: 'Hồ sơ mỹ phẩm', thu_tu: 2 },
    { ma_loai: 'TBYT', ten_loai: 'Hồ sơ trang thiết bị y tế', thu_tu: 3 },
    { ma_loai: 'TPBVSK_TU_CONG_BO', ten_loai: 'Hồ sơ tự công bố TPBVSK', thu_tu: 4 },
    { ma_loai: 'TPBVSK_CONG_BO', ten_loai: 'Hồ sơ công bố TPBVSK', thu_tu: 5 },
    { ma_loai: 'CFS_CPP', ten_loai: 'Hồ sơ CFS / CPP', thu_tu: 6 },
  ];

  for (const loai of loaiHoSoList) {
    await prisma.dm_loai_ho_so.upsert({
      where: { ma_loai: loai.ma_loai },
      update: {},
      create: loai,
    });
  }
  console.log('✅ Seeded dm_loai_ho_so');

  // 2. Seed dm_tinh_trang
  const tinhTrangList = [
    { ma_tinh_trang: 'CON_HIEU_LUC', ten_tinh_trang: 'Còn hiệu lực', mau_sac: '#52c41a', thu_tu: 1 },
    { ma_tinh_trang: 'SAP_HET_HAN', ten_tinh_trang: 'Sắp hết hạn', mau_sac: '#faad14', thu_tu: 2 },
    { ma_tinh_trang: 'DA_HET_HAN', ten_tinh_trang: 'Đã hết hạn', mau_sac: '#ff4d4f', thu_tu: 3 },
    { ma_tinh_trang: 'DANG_XU_LY', ten_tinh_trang: 'Đang xử lý', mau_sac: '#1890ff', thu_tu: 4 },
    { ma_tinh_trang: 'TAM_NGUNG', ten_tinh_trang: 'Tạm ngưng', mau_sac: '#8c8c8c', thu_tu: 5 },
  ];

  for (const tt of tinhTrangList) {
    await prisma.dm_tinh_trang.upsert({
      where: { ma_tinh_trang: tt.ma_tinh_trang },
      update: {},
      create: tt,
    });
  }
  console.log('✅ Seeded dm_tinh_trang');

  // 3. Seed dm_loai_tai_lieu
  const loaiTaiLieuList = [
    { ma_loai_tai_lieu: 'PHIEU_CONG_BO', ten_loai_tai_lieu: 'Phiếu công bố', thu_tu: 1 },
    { ma_loai_tai_lieu: 'NHAN', ten_loai_tai_lieu: 'Nhãn sản phẩm', thu_tu: 2 },
    { ma_loai_tai_lieu: 'HDSD', ten_loai_tai_lieu: 'Hướng dẫn sử dụng', thu_tu: 3 },
    { ma_loai_tai_lieu: 'TCCS', ten_loai_tai_lieu: 'Tiêu chuẩn cơ sở', thu_tu: 4 },
    { ma_loai_tai_lieu: 'CONG_VAN', ten_loai_tai_lieu: 'Công văn', thu_tu: 5 },
    { ma_loai_tai_lieu: 'QUANG_CAO', ten_loai_tai_lieu: 'Xác nhận quảng cáo', thu_tu: 6 },
    { ma_loai_tai_lieu: 'CFS', ten_loai_tai_lieu: 'Giấy chứng nhận lưu hành tự do (CFS)', thu_tu: 7 },
    { ma_loai_tai_lieu: 'CPP', ten_loai_tai_lieu: 'Giấy chứng nhận sản phẩm dược (CPP)', thu_tu: 8 },
    { ma_loai_tai_lieu: 'KHAC', ten_loai_tai_lieu: 'Khác', thu_tu: 9 },
  ];

  for (const loai of loaiTaiLieuList) {
    await prisma.dm_loai_tai_lieu.upsert({
      where: { ma_loai_tai_lieu: loai.ma_loai_tai_lieu },
      update: {},
      create: loai,
    });
  }
  console.log('✅ Seeded dm_loai_tai_lieu');

  // 4. Seed dm_loai_thay_doi
  const loaiThayDoiList = [
    { ma_loai_thay_doi: 'GIA_HAN', ten_loai_thay_doi: 'Gia hạn' },
    { ma_loai_thay_doi: 'BO_SUNG', ten_loai_thay_doi: 'Bổ sung' },
    { ma_loai_thay_doi: 'THAY_THE', ten_loai_thay_doi: 'Thay thế' },
    { ma_loai_thay_doi: 'DIEU_CHINH', ten_loai_thay_doi: 'Điều chỉnh' },
    { ma_loai_thay_doi: 'THAY_DOI_NHAN', ten_loai_thay_doi: 'Thay đổi nhãn' },
    { ma_loai_thay_doi: 'THAY_DOI_DIA_CHI', ten_loai_thay_doi: 'Thay đổi địa chỉ' },
    { ma_loai_thay_doi: 'KHAC', ten_loai_thay_doi: 'Khác' },
  ];

  for (const loai of loaiThayDoiList) {
    await prisma.dm_loai_thay_doi.upsert({
      where: { ma_loai_thay_doi: loai.ma_loai_thay_doi },
      update: {},
      create: loai,
    });
  }
  console.log('✅ Seeded dm_loai_thay_doi');

  // 5. Seed vai_tro
  const vaiTroList = [
    { ma_vai_tro: 'ADMIN', ten_vai_tro: 'Quản trị viên', mo_ta: 'Toàn quyền hệ thống' },
    { ma_vai_tro: 'EDITOR', ten_vai_tro: 'Biên tập viên', mo_ta: 'Quyền tạo/sửa hồ sơ' },
    { ma_vai_tro: 'VIEWER', ten_vai_tro: 'Người xem', mo_ta: 'Chỉ xem hồ sơ' },
  ];

  for (const vt of vaiTroList) {
    await prisma.vai_tro.upsert({
      where: { ma_vai_tro: vt.ma_vai_tro },
      update: {},
      create: vt,
    });
  }
  console.log('✅ Seeded vai_tro');

  // 6. Seed nguoi_dung (Admin)
  const adminRole = await prisma.vai_tro.findUnique({ where: { ma_vai_tro: 'ADMIN' } });
  if (adminRole) {
    const mat_khau_hash = await bcrypt.hash('admin123', 10);
    await prisma.nguoi_dung.upsert({
      where: { ma_nguoi_dung: 'ADMIN_01' },
      update: {},
      create: {
        ma_nguoi_dung: 'ADMIN_01',
        ho_ten: 'System Admin',
        email: 'admin@scb.com',
        mat_khau_hash,
        vai_tro_id: adminRole.id,
      },
    });
    console.log('✅ Seeded nguoi_dung (admin)');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
