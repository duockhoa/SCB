import { dateOnly, expiryStatus, reminderDate, todayInVietnam } from './expiry';

describe('dossier expiry rules', () => {
  it('subtracts six calendar months and clamps to the last day of a shorter month', () => {
    expect(reminderDate('2026-08-31')?.toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(reminderDate('2028-08-31')?.toISOString().slice(0, 10)).toBe('2028-02-29');
  });

  it('changes status on the reminder day and only expires after the expiry day', () => {
    expect(expiryStatus('2027-04-01', dateOnly('2026-09-30')!)).toBe('CON_HIEU_LUC');
    expect(expiryStatus('2027-04-01', dateOnly('2026-10-01')!)).toBe('SAP_HET_HAN');
    expect(expiryStatus('2027-04-01', dateOnly('2027-04-01')!)).toBe('SAP_HET_HAN');
    expect(expiryStatus('2027-04-01', dateOnly('2027-04-02')!)).toBe('DA_HET_HAN');
  });

  it('uses the Vietnam calendar day at the UTC boundary', () => {
    expect(todayInVietnam(new Date('2026-09-30T17:00:00Z')).toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(todayInVietnam(new Date('2026-09-30T16:59:59Z')).toISOString().slice(0, 10)).toBe('2026-09-30');
  });

  it('allows dossiers without an expiry date to remain valid', () => {
    expect(reminderDate(null)).toBeNull();
    expect(expiryStatus(null, dateOnly('2026-10-01')!)).toBe('CON_HIEU_LUC');
  });
});
