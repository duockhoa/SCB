export const EXPIRY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export type ExpiryStatus = 'CON_HIEU_LUC' | 'SAP_HET_HAN' | 'DA_HET_HAN';

export const EXPIRY_STATUSES: ExpiryStatus[] = ['CON_HIEU_LUC', 'SAP_HET_HAN', 'DA_HET_HAN'];

// Prisma stores these fields as DATE. Work with calendar dates at UTC midnight
// so the server's local timezone cannot shift a dossier by one day.
export function dateOnly(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const text = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const date = new Date(`${text}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`Invalid calendar date: ${text}`);
  }
  return date;
}

export function todayInVietnam(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EXPIRY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return dateOnly(`${part('year')}-${part('month')}-${part('day')}`)!;
}

export function reminderDate(expiry: Date | string | null | undefined): Date | null {
  const date = dateOnly(expiry);
  if (!date) return null;
  const firstOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 6, 1));
  const lastDay = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0)).getUTCDate();
  firstOfMonth.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return firstOfMonth;
}

export function expiryStatus(expiry: Date | string | null | undefined, today = todayInVietnam()): ExpiryStatus {
  const date = dateOnly(expiry);
  if (!date) return 'CON_HIEU_LUC';
  if (date.getTime() < today.getTime()) return 'DA_HET_HAN';
  return reminderDate(date)!.getTime() <= today.getTime() ? 'SAP_HET_HAN' : 'CON_HIEU_LUC';
}
