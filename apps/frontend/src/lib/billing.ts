/**
 * billing.ts — Biểu phí & công thức tính tiền dùng CHUNG cho màn Lập hợp đồng (Sale)
 * và màn Lập hóa đơn nhận phòng (Kế toán).
 *
 * Trước đây hai màn tự hardcode biểu phí riêng nên bị lệch nhau: Sale tính phí dịch vụ
 * cố định 250.000đ còn Kế toán thì không, dẫn tới tổng tiền hai bên khác nhau.
 *
 * Giá trị phí dịch vụ phải khớp với backend: config/contract-templates.ts → serviceFee.
 */

/** Phí dịch vụ cố định thu 1 lần khi ký hợp đồng nhận phòng (VNĐ). */
export const SERVICE_FEE = 250_000;

/** Phí cấp thẻ từ (2 thẻ) — tùy chọn, kế toán có thể bỏ tick. */
export const CARD_FEE = 100_000;

/** Phí vệ sinh ban đầu — tùy chọn, kế toán có thể bỏ tick. */
export const CLEANING_FEE = 200_000;

export interface CheckinChargeInput {
  /** Tiền thuê tháng đầu. */
  monthlyRent: number;
  /** Có thu phí cấp thẻ từ hay không (mặc định có). */
  cardFee?: boolean;
  /** Có thu phí vệ sinh ban đầu hay không (mặc định có). */
  cleaningFee?: boolean;
}

/**
 * Tính TỔNG PHẢI THU khi khách nhận phòng.
 *
 * LƯU Ý NGHIỆP VỤ: KHÔNG cộng tiền đặt cọc vào tổng này. Khách đã thanh toán khoản cọc
 * ở bước đặt cọc trước đó rồi; cộng lại là thu trùng. Tiền cọc chỉ được HIỂN THỊ như một
 * dòng thông tin "đã thanh toán trước" để khách đối chiếu.
 */
export function calcCheckinTotal({
  monthlyRent,
  cardFee = true,
  cleaningFee = true,
}: CheckinChargeInput): number {
  return (
    (Number(monthlyRent) || 0) +
    SERVICE_FEE +
    (cardFee ? CARD_FEE : 0) +
    (cleaningFee ? CLEANING_FEE : 0)
  );
}
