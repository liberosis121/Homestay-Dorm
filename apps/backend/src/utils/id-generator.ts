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
  // Bước 1: Query tất cả ID có prefix này trong bảng, sắp xếp giảm dần → lấy cái lớn nhất
  // LIKE 'DKT-%' = lọc những ID bắt đầu bằng 'DKT-'
  const { data, error } = await supabase
    .from(table)
    .select(idColumn)
    .like(idColumn, `${prefix}-%`)   // Chỉ lấy ID của prefix này (không lẫn với PDC hay LXM)
    .order(idColumn, { ascending: false }) // Sắp xếp Z→A (giảm dần) → phần tử đầu tiên là ID lớn nhất
    .limit(1);                        // Chỉ cần 1 bản ghi (lớn nhất) → tối ưu hiệu suất

  if (error) {
    throw new Error(`[ID Generator] Không thể query bảng "${table}": ${error.message}`);
  }

  // Bước 2: Tính số thứ tự tiếp theo
  let nextNumber = 1; // Mặc định bắt đầu từ 1 nếu chưa có bản ghi nào

  if (data && data.length > 0) {
    const latestId: string = (data[0] as unknown as Record<string, string>)[idColumn]; // Ví dụ: "DKT-002"
    // Tách phần số ra: "DKT-002".split('-')[1] → "002" → parseInt("002") → 2
    const latestNumber = parseInt(latestId.split('-')[1], 10);
    if (!isNaN(latestNumber)) {
      nextNumber = latestNumber + 1; // 2 + 1 = 3
    }
  }

  // Bước 3: Ghép lại thành ID mới với zero-padding 3 chữ số
  // String(3) → '3' → padStart(3, '0') → '003'
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}-${paddedNumber}`; // → 'DKT-003'
}
