const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.dm_cong_ty.count();
  console.log(`TOTAL COMPANIES: ${count}`);
}
main().finally(() => prisma.$disconnect());
