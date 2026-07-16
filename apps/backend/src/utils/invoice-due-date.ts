/**
 * Quy tac han thanh toan (dung chung cho MOI loai hoa don, ca phong ca nhan lan phong nhom —
 * han gan voi HOP DONG/PHIEU COC nen thanh vien nhom deu thay cung mot han voi nguoi dai dien).
 *
 * - Hoa don dinh ky (co ky dien/nuoc): ngay 10 cua thang KE TIEP sau ky ghi chi so,
 *   nhung KHONG BAO GIO som hon ngay lap + MIN_GRACE_DAYS. Ke toan co the lap hoa don tre
 *   (vd: lap ky 06/2026 vao 13/07/2026) — khi do khach van phai co toi thieu 7 ngay de tra,
 *   thay vi bi danh 'Qua han' ngay luc hoa don vua duoc phat hanh.
 * - Hoa don nhan phong / phat sinh: ngay lap + CHECKIN_DUE_DAYS.
 */
export const MONTHLY_DUE_DAY = 10;
export const MIN_GRACE_DAYS = 7;
export const CHECKIN_DUE_DAYS = 3;

const toDateOnly = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (issuedAt: string | Date, days: number): string => {
  const base = new Date(issuedAt);
  base.setDate(base.getDate() + days);
  return toDateOnly(base);
};

/**
 * billingPeriod: 'YYYY-MM' (dinh dang luu trong electricity_water_records.billing_period).
 */
export const computeMonthlyDueDate = (billingPeriod: string, issuedAt: string | Date = new Date()): string => {
  const floor = addDays(issuedAt, MIN_GRACE_DAYS);

  const match = /^(\d{4})-(\d{1,2})$/.exec(billingPeriod || '');
  if (!match) return floor;

  const year = Number(match[1]);
  const month = Number(match[2]); // 1-based -> dung lam index 0-based cua Date = thang ke tiep
  const scheduled = toDateOnly(new Date(year, month, MONTHLY_DUE_DAY));

  return scheduled > floor ? scheduled : floor;
};

export const computeCheckinDueDate = (issuedAt: string | Date = new Date()): string =>
  addDays(issuedAt, CHECKIN_DUE_DAYS);
