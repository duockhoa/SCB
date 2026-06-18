"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
require("dotenv/config");
const adapter = new adapter_mariadb_1.PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new client_1.PrismaClient({ adapter });
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
                gia_tri: null,
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
//# sourceMappingURL=seed_mail_config.js.map