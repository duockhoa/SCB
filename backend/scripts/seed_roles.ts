import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import "dotenv/config";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial RBAC roles & permissions...');

  const roles = [
    {
      ma_vai_tro: 'ADMIN',
      ten_vai_tro: 'Quản trị viên hệ thống',
      mo_ta: 'Toàn quyền cấu hình, quản lý người dùng, phân quyền và dữ liệu hồ sơ',
      quyen_han: JSON.stringify(['*'])
    },
    {
      ma_vai_tro: 'TRUONG_PHONG',
      ten_vai_tro: 'Trưởng phòng Đăng ký',
      mo_ta: 'Toàn quyền quản lý, duyệt, cấp số, gia hạn, thay thế và xóa hồ sơ sản phẩm',
      quyen_han: JSON.stringify([
        'HOSO_VIEW', 'HOSO_CREATE', 'HOSO_UPDATE', 'HOSO_DELETE', 
        'HOSO_CAP_SO', 'HOSO_GIA_HAN', 'HOSO_THAY_THE', 'HOSO_THAY_DOI', 
        'HOSO_TAI_LIEU', 'CONG_TY_VIEW', 'CONG_TY_MANAGE', 'DANH_MUC_VIEW', 
        'DANH_MUC_MANAGE', 'SYSTEM_LOGS'
      ])
    },
    {
      ma_vai_tro: 'NV_DANG_KY',
      ten_vai_tro: 'Nhân viên Đăng ký hồ sơ',
      mo_ta: 'Tạo mới, cập nhật, cấp số, gia hạn, bổ sung lịch sử và tài liệu đính kèm',
      quyen_han: JSON.stringify([
        'HOSO_VIEW', 'HOSO_CREATE', 'HOSO_UPDATE', 'HOSO_CAP_SO', 
        'HOSO_GIA_HAN', 'HOSO_THAY_DOI', 'HOSO_TAI_LIEU', 'CONG_TY_VIEW', 
        'DANH_MUC_VIEW'
      ])
    },
    {
      ma_vai_tro: 'EDITOR',
      ten_vai_tro: 'Biên tập viên hồ sơ',
      mo_ta: 'Chỉnh sửa, cập nhật thông tin và bổ sung tài liệu hồ sơ',
      quyen_han: JSON.stringify([
        'HOSO_VIEW', 'HOSO_CREATE', 'HOSO_UPDATE', 'HOSO_THAY_DOI', 
        'HOSO_TAI_LIEU', 'CONG_TY_VIEW', 'DANH_MUC_VIEW'
      ])
    },
    {
      ma_vai_tro: 'KIEM_SOAT',
      ten_vai_tro: 'Kiểm soát & Thẩm định',
      mo_ta: 'Tra cứu hồ sơ, danh mục và theo dõi nhật ký hoạt động hệ thống',
      quyen_han: JSON.stringify([
        'HOSO_VIEW', 'CONG_TY_VIEW', 'DANH_MUC_VIEW', 'SYSTEM_LOGS'
      ])
    },
    {
      ma_vai_tro: 'VIEWER',
      ten_vai_tro: 'Người xem (Chỉ đọc)',
      mo_ta: 'Chỉ có quyền tra cứu danh sách và xem chi tiết hồ sơ sản phẩm',
      quyen_han: JSON.stringify([
        'HOSO_VIEW', 'CONG_TY_VIEW', 'DANH_MUC_VIEW'
      ])
    }
  ];

  for (const role of roles) {
    const existing = await prisma.vai_tro.findUnique({
      where: { ma_vai_tro: role.ma_vai_tro }
    });

    if (existing) {
      // Chỉ cập nhật quyen_han nếu đang trống
      await prisma.vai_tro.update({
        where: { id: existing.id },
        data: {
          quyen_han: existing.quyen_han || role.quyen_han,
          mo_ta: existing.mo_ta || role.mo_ta,
        }
      });
      console.log(`- Role ${role.ma_vai_tro}: Verified/Updated`);
    } else {
      await prisma.vai_tro.create({
        data: role
      });
      console.log(`- Role ${role.ma_vai_tro}: Created`);
    }
  }

  console.log('Seeding RBAC roles completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
