import 'dotenv/config';
import { open } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { EXPIRY_STATUSES, expiryStatus, reminderDate, todayInVietnam } from '../src/ho-so/expiry';

const apply = process.argv.includes('--apply');
const backupIndex = process.argv.indexOf('--backup');
const backupPath = backupIndex >= 0 ? process.argv[backupIndex + 1] : undefined;

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (apply && (!backupPath || backupPath.startsWith('--'))) {
    throw new Error('Applying requires --backup <new-jsonl-path>');
  }
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL) });
  const backup = apply ? await open(backupPath!, 'wx') : null;
  try {
    const statuses = await prisma.dm_tinh_trang.findMany({
      where: { ma_tinh_trang: { in: EXPIRY_STATUSES } },
    });
    const ids = new Map(statuses.map((status) => [status.ma_tinh_trang, status.id]));
    for (const code of EXPIRY_STATUSES) {
      if (!ids.has(code)) throw new Error(`Missing status ${code}`);
    }
    const today = todayInVietnam();
    const result = { checked: 0, changed: 0, applied: 0, skippedConcurrent: 0, transitions: {} as Record<string, number>, examples: [] as Array<{ id: number; from: string; to: string; expiry: string }> };
    let cursor = 0;
    for (;;) {
      const rows = await prisma.ho_so_chung.findMany({
        where: { id: { gt: cursor }, tinh_trang_id: { in: [...ids.values()] } },
        select: { id: true, ngay_het_han: true, ngay_nhac_han: true, tinh_trang_id: true },
        orderBy: { id: 'asc' },
        take: 200,
      });
      if (!rows.length) break;
      cursor = rows[rows.length - 1].id;
      const changes = rows.flatMap((row) => {
        result.checked++;
        if (!row.ngay_het_han) return [];
        const nextStatusId = ids.get(expiryStatus(row.ngay_het_han, today))!;
        const nextReminder = reminderDate(row.ngay_het_han);
        if (row.tinh_trang_id === nextStatusId &&
          row.ngay_nhac_han?.getTime() === nextReminder?.getTime()) return [];
        result.changed++;
        const previousCode = statuses.find((status) => status.id === row.tinh_trang_id)?.ma_tinh_trang;
        const nextCode = statuses.find((status) => status.id === nextStatusId)?.ma_tinh_trang;
        const key = previousCode === nextCode ? 'ngay_nhac_han' : `${previousCode}->${nextCode}`;
        result.transitions[key] = (result.transitions[key] ?? 0) + 1;
        if (previousCode !== nextCode && result.examples.length < 20) {
          result.examples.push({ id: row.id, from: previousCode!, to: nextCode!, expiry: row.ngay_het_han.toISOString().slice(0, 10) });
        }
        return [{ row, nextStatusId, nextReminder }];
      });
      if (!backup || !changes.length) continue;
      await backup.write(changes.map(({ row }) => JSON.stringify(row)).join('\n') + '\n');
      await backup.sync();
      for (const { row, nextStatusId, nextReminder } of changes) {
        const updated = await prisma.ho_so_chung.updateMany({
          where: { id: row.id, tinh_trang_id: row.tinh_trang_id, ngay_het_han: row.ngay_het_han },
          data: { tinh_trang_id: nextStatusId, ngay_nhac_han: nextReminder },
        });
        if (updated.count) result.applied++;
        else result.skippedConcurrent++;
      }
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', date: today.toISOString().slice(0, 10), ...result }));
  } finally {
    if (backup) await backup.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
