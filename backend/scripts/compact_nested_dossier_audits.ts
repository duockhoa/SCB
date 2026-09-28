import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import * as mariadb from 'mariadb';
import { compactLegacySnapshot } from '../src/ho-so/ho-so-audit';

const apply = process.argv.includes('--apply');
const backupIndex = process.argv.indexOf('--backup');
const backupPath = backupIndex >= 0 ? process.argv[backupIndex + 1] : undefined;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const url = new URL(databaseUrl);
  const connection = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
  });
  try {
    const rows = await connection.query('SELECT id, du_lieu_cu FROM nhat_ky_ho_so WHERE du_lieu_cu IS NOT NULL') as Array<{ id: number; du_lieu_cu: string }>;
    const result = { checked: 0, changed: 0, unchanged: 0, invalid: 0, unrecognized: 0, bytesSaved: 0 };
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
    if (apply && updates.length) {
      if (!backupPath) throw new Error('Applying requires --backup <path>');
      await writeFile(
        backupPath,
        JSON.stringify({
          createdAt: new Date().toISOString(),
          rows: updates.map(({ id, original }) => ({ id, du_lieu_cu: original })),
        }),
        { flag: 'wx' },
      );
      await connection.beginTransaction();
      for (const update of updates) await connection.query('UPDATE nhat_ky_ho_so SET du_lieu_cu = ? WHERE id = ?', [update.value, update.id]);
      await connection.commit();
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...result }));
  } catch (error) {
    if (apply) await connection.rollback();
    throw error;
  } finally { await connection.end(); }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
