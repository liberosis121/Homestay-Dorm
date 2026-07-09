/**
 * Rút gọn mã ID dài (như UUID) thành 8 ký tự đầu tiên để hiển thị gọn gàng trên giao diện.
 * Tự động chuyển đổi các tiền tố nội bộ (ví dụ: 'DEP-' thành 'HĐ-') và cắt ngắn kết quả.
 */
export function formatShortId(id?: string): string {
  if (!id) return '';
  const cleanId = id.replace('DEP-', 'HĐ-');
  return cleanId.length > 8 ? cleanId.substring(0, 8) : cleanId;
}
