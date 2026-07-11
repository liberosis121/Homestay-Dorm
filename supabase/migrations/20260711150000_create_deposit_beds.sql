-- Bảng nối: một phiếu đặt cọc NHÓM giữ chỗ NHIỀU giường cùng lúc.
--
-- Bối cảnh: trước đây mỗi phiếu cọc chỉ trỏ 1 giường qua deposit_requests.bed_id,
-- hoặc cọc nguyên phòng (bed_id = NULL, chỉ room_id). Nay hỗ trợ nhóm thuê N giường
-- cụ thể trong 1 phòng bằng 1 phiếu cọc duy nhất → 1 hóa đơn chung → 1 hợp đồng nhóm.
--
-- Cách phân biệt 3 loại cọc (không cần thêm cột vào deposit_requests):
--   • bed_id có giá trị                          → cọc 1 giường lẻ
--   • bed_id = NULL  +  CÓ dòng trong deposit_beds → cọc NHÓM N giường cụ thể
--   • bed_id = NULL  +  KHÔNG có deposit_beds      → cọc nguyên phòng
--
-- Lưu ý kiểu dữ liệu: bed_id để VARCHAR cho khớp deposit_requests.bed_id (tham chiếu beds.id).
-- Nếu beds.id ở schema thực là UUID, đổi VARCHAR → UUID tương ứng trước khi chạy.

CREATE TABLE IF NOT EXISTS public.deposit_beds (
  deposit_id  VARCHAR NOT NULL REFERENCES public.deposit_requests(id) ON DELETE CASCADE,
  bed_id      VARCHAR NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Một giường chỉ xuất hiện tối đa 1 lần trong cùng 1 phiếu cọc.
  PRIMARY KEY (deposit_id, bed_id)
);

-- PK đã bao deposit_id (cột dẫn đầu); thêm index tra ngược theo giường.
CREATE INDEX IF NOT EXISTS idx_deposit_beds_bed ON public.deposit_beds(bed_id);
