import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import "dotenv/config";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding mail configurations...');
  
  await prisma.cau_hinh_gui_mail.createMany({
    data: [
      {
        ma_su_kien: 'hoSo.updated',
        loai_dieu_kien: 'ROLE',
        gia_tri: 'ADMIN',
      },
      {
        ma_su_kien: 'hoSo.updated',
        loai_dieu_kien: 'NGUOI_PHU_TRACH',
        gia_tri: null, // Sẽ lấy từ nguoi_tao_id của hồ sơ
      }
    ],
    skipDuplicates: true
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
