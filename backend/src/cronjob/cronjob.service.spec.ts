import { CronjobService } from './cronjob.service';

describe('expiry reconciliation', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T00:00:00Z'));
  });
  afterEach(() => jest.useRealTimers());

  it('transitions at the six-month boundary and records one reminder', async () => {
    const row = {
      id: 7, ma_ho_so: 'HS-7', ten_san_pham: 'Sản phẩm', so_chinh: '123',
      ngay_het_han: new Date('2027-04-01T00:00:00Z'),
      ngay_nhac_han: null, tinh_trang_id: 1,
    };
    const tx = {
      ho_so_chung: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      nhac_han_ho_so: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      dm_tinh_trang: { findMany: jest.fn().mockResolvedValue([
        { ma_tinh_trang: 'CON_HIEU_LUC', id: 1 },
        { ma_tinh_trang: 'SAP_HET_HAN', id: 2 },
        { ma_tinh_trang: 'DA_HET_HAN', id: 3 },
      ]) },
      ho_so_chung: { findMany: jest.fn().mockResolvedValueOnce([row]).mockResolvedValueOnce([]) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const events = { emit: jest.fn() };
    await new CronjobService(prisma as any, events as any).handleExpirationCheck();

    expect(tx.ho_so_chung.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        tinh_trang_id: 2,
        ngay_nhac_han: new Date('2026-10-01T00:00:00Z'),
      },
    }));
    expect(tx.nhac_han_ho_so.create).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith('hoSo.expiryChanged', expect.objectContaining({
      eventName: 'HO_SO_SAP_HET_HAN',
    }));
  });

  it('does not duplicate a reminder when a concurrent run already updated the row', async () => {
    const row = {
      id: 7, ma_ho_so: 'HS-7', ten_san_pham: 'Sản phẩm', so_chinh: '123',
      ngay_het_han: new Date('2027-04-01T00:00:00Z'),
      ngay_nhac_han: null, tinh_trang_id: 1,
    };
    const tx = {
      ho_so_chung: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      nhac_han_ho_so: { create: jest.fn() },
    };
    const prisma = {
      dm_tinh_trang: { findMany: jest.fn().mockResolvedValue([
        { ma_tinh_trang: 'CON_HIEU_LUC', id: 1 },
        { ma_tinh_trang: 'SAP_HET_HAN', id: 2 },
        { ma_tinh_trang: 'DA_HET_HAN', id: 3 },
      ]) },
      ho_so_chung: { findMany: jest.fn().mockResolvedValueOnce([row]).mockResolvedValueOnce([]) },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const events = { emit: jest.fn() };
    await new CronjobService(prisma as any, events as any).handleExpirationCheck();

    expect(tx.nhac_han_ho_so.create).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });
});
