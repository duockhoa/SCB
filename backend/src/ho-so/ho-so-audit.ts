import { Prisma } from '@prisma/client';

const detailFields: Record<string, Record<string, string>> = {
  ho_so_thuoc: Prisma.Ho_so_thuocScalarFieldEnum,
  ho_so_my_pham: Prisma.Ho_so_my_phamScalarFieldEnum,
  ho_so_tbyt: Prisma.Ho_so_tbytScalarFieldEnum,
  ho_so_tpbvsk_tu_cong_bo: Prisma.Ho_so_tpbvsk_tu_cong_boScalarFieldEnum,
  ho_so_tpbvsk_cong_bo: Prisma.Ho_so_tpbvsk_cong_boScalarFieldEnum,
  ho_so_cfs_cpp: Prisma.Ho_so_cfs_cppScalarFieldEnum,
};

function pickScalars(source: Record<string, unknown>, fields: Record<string, string>) {
  return Object.fromEntries(Object.values(fields)
    .filter((key) => Object.hasOwn(source, key))
    .map((key) => [key, source[key]]));
}

// An explicit scalar allow-list prevents relations (especially previous audit
// entries and user records) from becoming part of the next snapshot.
export function dossierSnapshot(dossier: Record<string, any>) {
  const details = Object.entries(detailFields)
    .filter(([key]) => dossier[key] != null)
    .map(([key, fields]) => [key, pickScalars(dossier[key], fields)]);
  return {
    ...pickScalars(dossier, Prisma.Ho_so_chungScalarFieldEnum),
    ...Object.fromEntries(details),
  };
}

export type CompactResult =
  | { status: 'changed'; value: string }
  | { status: 'unchanged' | 'invalid' | 'unrecognized' };

// Preserve all other historical fields. Never rewrite unknown/malformed shapes.
export function compactLegacySnapshot(raw: string | null): CompactResult {
  if (raw === null) return { status: 'unchanged' };
  let value: any;
  try { value = JSON.parse(raw); } catch { return { status: 'invalid' }; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { status: 'unrecognized' };
  }
  if (!Object.hasOwn(value, 'nhat_ky')) return { status: 'unchanged' };
  if (!Number.isInteger(value.id) || typeof value.ma_ho_so !== 'string' || !Array.isArray(value.nhat_ky)) {
    return { status: 'unrecognized' };
  }
  const { nhat_ky, ...preserved } = value;
  return { status: 'changed', value: JSON.stringify(preserved) };
}
