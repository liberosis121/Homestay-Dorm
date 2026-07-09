/**
 * Rút gọn mã ID dài (như UUID) thành 8 ký tự đầu tiên để hiển thị gọn gàng trên giao diện.
 * Tự động thêm tiền tố chuẩn theo loại nghiệp vụ (type) hoặc tự nhận dạng từ tiền tố cũ.
 *
 * Danh sách type & tiền tố:
 *   'contract'  → HĐ-   (Hợp đồng)
 *   'invoice'   → HD-   (Hóa đơn)
 *   'deposit'   → CC-   (Cọc / Phiếu cọc)
 *   'refund'    → TL-   (Thanh lý / Hoàn tiền)
 *   'checkout'  → TS-   (Tài sản / Bàn giao)
 *   'schedule'  → LXM-  (Lịch xem phòng / Lịch hẹn)
 *   'employee'  → NV-   (Nhân viên)
 *   'customer'  → KH-   (Khách hàng)
 *   'branch'    → CS-   (Cơ sở / Chi nhánh)
 *   'room'      → PH-   (Phòng)
 */
export function formatShortId(
  id?: string,
  type?: 'contract' | 'invoice' | 'deposit' | 'refund' | 'checkout' | 'schedule' | 'employee' | 'customer' | 'branch' | 'room'
): string {
  if (!id) return '';

  // Strip all known prefixes to get the bare ID segment
  const cleanId = id.replace(/^(DEP|HD|HĐ|CC|TL|TS|LXM|LH|NV|KH|CS|PH)-/, '');
  const slicedId = cleanId.length > 8 ? cleanId.substring(0, 8) : cleanId;

  // Explicit type takes priority
  if (type === 'contract')  return `HĐ-${slicedId}`;
  if (type === 'invoice')   return `HD-${slicedId}`;
  if (type === 'deposit')   return `CC-${slicedId}`;
  if (type === 'refund')    return `TL-${slicedId}`;
  if (type === 'checkout')  return `TS-${slicedId}`;
  if (type === 'schedule')  return `LXM-${slicedId}`;
  if (type === 'employee')  return `NV-${slicedId}`;
  if (type === 'customer')  return `KH-${slicedId}`;
  if (type === 'branch')    return `CS-${slicedId}`;
  if (type === 'room')      return `PH-${slicedId}`;

  // Auto-detect from original prefix
  if (id.startsWith('DEP-') || id.startsWith('HĐ-')) return `HĐ-${slicedId}`;
  if (id.startsWith('HD-'))  return `HD-${slicedId}`;
  if (id.startsWith('CC-'))  return `CC-${slicedId}`;
  if (id.startsWith('TL-'))  return `TL-${slicedId}`;
  if (id.startsWith('TS-'))  return `TS-${slicedId}`;
  if (id.startsWith('LXM-') || id.startsWith('LH-')) return `LXM-${slicedId}`;
  if (id.startsWith('NV-'))  return `NV-${slicedId}`;
  if (id.startsWith('KH-'))  return `KH-${slicedId}`;
  if (id.startsWith('CS-'))  return `CS-${slicedId}`;
  if (id.startsWith('PH-'))  return `PH-${slicedId}`;

  return slicedId;
}

