/**
 * Utility de tu dong tao ma ID theo format co prefix (VD: DKT-001, LXM-002, PDC-003).
 * Phu thuoc: utils/supabase.ts
 */

import { supabase } from './supabase';

/**
 * Sinh ID tiếp theo theo format: {PREFIX}-{000}
 *
 * @param prefix   - Tiền tố ID, ví dụ: 'DKT', 'LXM', 'PDC' (từ constants.ts)
 * @param table    - Tên bảng trong database để query ID lớn nhất hiện có
 * @param idColumn - Tên cột chứa ID (mặc định là 'id')
 * @returns        - ID mới, ví dụ: 'DKT-003'
 *
 * @example
 * const newId = await generateNextId('DKT', 'rental_registrations');
 * // DB đang có DKT-001, DKT-002 → trả về 'DKT-003'
 */
export async function generateNextId(
  prefix: string,
  table: string,
  idColumn: string = 'id'
): Promise<string> {
  // Bước 1: Lấy TẤT CẢ ID có prefix này trong bảng
  // Lý do không dùng ORDER BY string: string sort cho kết quả sai khi số > 9
  // Ví dụ: 'DKT-9' > 'DKT-10' theo string sort vì '9' > '1'
  const { data, error } = await supabase
    .from(table)
    .select(idColumn)
    .like(idColumn, `${prefix}-%`); // Chỉ lấy ID của prefix này (không lẫn với PDC hay LXM)

  if (error) {
    throw new Error(`[ID Generator] Không thể query bảng "${table}": ${error.message}`);
  }

  // Bước 2: Tìm số lớn nhất bằng cách so sánh kiểu số (numeric), không phải kiểu chuỗi
  let maxNumber = 0;

  if (data && data.length > 0) {
    for (const row of data) {
      const id: string = (row as unknown as Record<string, string>)[idColumn];
      const parts = id.split('-');
      // ID format: PREFIX-NNN → parts[1] là phần số
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  // Bước 3: Ghép lại thành ID mới với zero-padding 3 chữ số
  // String(3) → '3' → padStart(3, '0') → '003'
  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}-${paddedNumber}`; // → 'DKT-003'
}
