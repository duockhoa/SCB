import 'dotenv/config';
import { open } from 'node:fs/promises';
import * as mariadb from 'mariadb';
import { compactLegacySnapshot } from '../src/ho-so/ho-so-audit';

const apply = process.argv.includes('--apply');
const backupIndex = process.argv.indexOf('--backup');
const backupPath = backupIndex >= 0 ? process.argv[backupIndex + 1] : undefined;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (apply && (!backupPath || backupPath.startsWith('--'))) {
    throw new Error('Applying requires --backup <new-json-path>');
  }
  const url = new URL(databaseUrl);
  const connection = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  });
  let backup: Awaited<ReturnType<typeof open>> | null = null;
  let inTransaction = false;
  try {
    if (apply) {
      backup = await open(backupPath!, 'wx');
      await backup.write(JSON.stringify({ createdAt: new Date().toISOString() }).slice(0, -1) + ',"rows":[');
    }
    const result = { checked: 0, changed: 0, unchanged: 0, invalid: 0, unrecognized: 0, bytesSaved: 0, applied: 0, skippedConcurrent: 0 };
    let cursor = 0;
    let firstBackupRow = true;
    for (;;) {
      const rows = await connection.query(
        'SELECT id, du_lieu_cu FROM nhat_ky_ho_so WHERE id > ? AND du_lieu_cu IS NOT NULL ORDER BY id LIMIT 200',
        [cursor],
      ) as Array<{ id: number; du_lieu_cu: string }>;
      if (!rows.length) break;
      cursor = rows[rows.length - 1].id;
      const updates: Array<{ id: number; value: string; original: string }> = [];
      for (const row of rows) {
        result.checked++;
        const compacted = compactLegacySnapshot(row.du_lieu_cu);
        if (compacted.status === 'changed') {
          result.changed++;
          result.bytesSaved += Buffer.byteLength(row.du_lieu_cu) - Buffer.byteLength(compacted.value);
          updates.push({ id: row.id, value: compacted.value, original: row.du_lieu_cu });
        } else result[compacted.status]++;
      }
      if (!backup || !updates.length) continue;
      const backupRows = updates.map(({ id, original }) => JSON.stringify({ id, du_lieu_cu: original }));
      await backup.write((firstBackupRow ? '' : ',') + backupRows.join(','));
      firstBackupRow = false;
      await backup.sync();
      await connection.beginTransaction();
      inTransaction = true;
      for (const update of updates) {
        const response = await connection.query(
          'UPDATE nhat_ky_ho_so SET du_lieu_cu = ? WHERE id = ? AND du_lieu_cu = ?',
          [update.value, update.id, update.original],
        ) as { affectedRows: number };
        if (response.affectedRows) result.applied++;
        else result.skippedConcurrent++;
      }
      await connection.commit();
      inTransaction = false;
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...result }));
  } catch (error) {
    if (inTransaction) await connection.rollback();
    throw error;
  } finally {
    if (backup) {
      await backup.write(']}');
      await backup.close();
    }
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
