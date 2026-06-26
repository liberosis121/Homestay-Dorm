/**
 * 📁 FILE: utils/id-generator.ts
 * 🎯 MỤC ĐÍCH: Tạo mã ID tự động theo format có prefix nghiệp vụ (DKT-001, LXM-002, PDC-003...)
 * 🏗️ TẦNG: Utility Layer (hàm tiện ích dùng ở tầng Service)
 * 📦 PHỤ THUỘC:
 *   - utils/supabase.ts   → Client kết nối database để query ID hiện có
 *   - types/constants.ts  → Các prefix ID (DKT, LXM, PDC)
 *
 * ❓ TẠI SAO CẦN SINH ID THỦ CÔNG? Không dùng UUID hoặc auto-increment?
 *
 *  Có 3 cách tạo ID phổ biến trong web dev:
 *
 *  1. AUTO-INCREMENT (số tự tăng): 1, 2, 3, 4...
 *     ✅ Đơn giản
 *     ❌ Không có ý nghĩa (nhìn vào số 42 không biết đó là phiếu gì)
 *     ❌ Lộ số lượng bản ghi (đối thủ biết bạn có bao nhiêu đơn hàng)
 *
 *  2. UUID (Universal Unique Identifier): "550e8400-e29b-41d4-a716-446655440000"
 *     ✅ Không bao giờ trùng dù nhiều server cùng tạo
 *     ❌ Dài, khó nhớ, khó đọc qua điện thoại với khách hàng
 *     ❌ Không có ý nghĩa nghiệp vụ
 *
 *  3. PREFIX + SỐ THỨ TỰ CÓ PADDING: "DKT-001", "LXM-042"  ← Chúng ta dùng cách này
 *     ✅ Có ý nghĩa: nhìn vào biết ngay loại phiếu
 *     ✅ Nhân viên dễ tra cứu, hỗ trợ khách hàng qua điện thoại
 *     ✅ Ngắn gọn, chuyên nghiệp
 *     ⚠️ Phải cẩn thận race condition (2 request cùng tạo ID lúc 1 giây → cả 2 đọc được số 5 → tạo ra DKT-005 và DKT-005 bị trùng)
 *     → Cách xử lý: dùng UNIQUE constraint trong Supabase → cái nào INSERT trùng thì Supabase báo lỗi, retry lại
 *
 * 🔢 PADDING là gì?
 *  "001" thay vì "1" → gọi là zero-padding (thêm số 0 vào trước cho đủ độ dài)
 *  padStart(3, '0') nghĩa là: đảm bảo chuỗi có ít nhất 3 ký tự, thiếu thì thêm '0' vào đầu
 *  → 1   → '1'.padStart(3, '0')   → '001'
 *  → 12  → '12'.padStart(3, '0')  → '012'
 *  → 123 → '123'.padStart(3, '0') → '123' (đã đủ 3 ký tự, giữ nguyên)
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
