export type GroupRefundInput = {
  removedBedPrices: number[];
  originalDeposit: number;
  originalOccupants: number;
  removedCount: number;
};

export function calculateRemovedGroupDepositRefund(input: GroupRefundInput): number {
  if (input.removedCount <= 0) return 0;

  const bedPriceRefund = input.removedBedPrices
    .slice(0, input.removedCount)
    .reduce((sum, price) => sum + Math.max(Number(price) || 0, 0) * 2, 0);
  if (bedPriceRefund > 0) return bedPriceRefund;

  if (input.originalDeposit <= 0 || input.originalOccupants <= 0) return 0;
  return Math.round((input.originalDeposit / input.originalOccupants) * input.removedCount);
}

export function calculateCurrentDepositMonthlyRent(input: {
  bedPrices: number[];
  roomPrice: number;
}): number {
  const bedRent = input.bedPrices.reduce((sum, price) => sum + Math.max(Number(price) || 0, 0), 0);
  if (bedRent > 0) return bedRent;
  return Math.max(Number(input.roomPrice) || 0, 0);
}
