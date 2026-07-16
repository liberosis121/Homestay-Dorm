export type GroupRefundInput = {
  removedBedPrices: number[];
  originalDeposit: number;
  originalOccupants: number;
  removedCount: number;
  /** Tỉ lệ hoàn (vd 0.8 = giữ lại 20% phí phạt). Mặc định 1 (hoàn 100%). */
  refundRate?: number;
};

/**
 * Hoàn cọc phần thành viên bị loại (TH3):
 *   hoàn = (tổng giá giường bị loại × 2 tháng) × refundRate.
 * Nếu không suy được giá giường → chia đều theo số người: (cọc/occupants × removedCount) × refundRate.
 */
export function calculateRemovedGroupDepositRefund(input: GroupRefundInput): number {
  if (input.removedCount <= 0) return 0;
  const rate = input.refundRate == null ? 1 : input.refundRate;

  const bedPriceRefund = input.removedBedPrices
    .slice(0, input.removedCount)
    .reduce((sum, price) => sum + Math.max(Number(price) || 0, 0) * 2, 0);
  if (bedPriceRefund > 0) return Math.round(bedPriceRefund * rate);

  if (input.originalDeposit <= 0 || input.originalOccupants <= 0) return 0;
  return Math.round((input.originalDeposit / input.originalOccupants) * input.removedCount * rate);
}

export function calculateCurrentDepositMonthlyRent(input: {
  bedPrices: number[];
  roomPrice: number;
}): number {
  const bedRent = input.bedPrices.reduce((sum, price) => sum + Math.max(Number(price) || 0, 0), 0);
  if (bedRent > 0) return bedRent;
  return Math.max(Number(input.roomPrice) || 0, 0);
}
