-- Bảng nối n-n giữa phiếu đăng ký thuê và khách hàng (thành viên nhóm thuê).
-- Trước đây rental_registrations chỉ trỏ tới đúng 1 khách qua cột cccd (người nộp đơn).
-- Nay giữ cccd trên rental_registrations làm NGƯỜI ĐẠI DIỆN (ký HĐ, nhận hóa đơn),
-- đồng thời dùng bảng này để biết 1 phiếu thuê gồm những khách hàng nào (thuê nhóm).
--
-- Thiết kế chuẩn hóa: chỉ lưu 2 khóa ngoại + cờ đại diện.
-- Họ tên / email / sđt / cccd của thành viên KHÔNG lưu ở đây (suy ra từ bảng customers khi cần).
--
-- Ràng buộc nghiệp vụ (được backend kiểm tra khi tạo đơn nhóm):
--   - Mỗi thành viên phải là 1 tài khoản khách hàng đã tồn tại và có hồ sơ đầy đủ.
--   - Họ tên + email nhập khi đăng ký phải khớp hồ sơ tài khoản (đối chiếu theo CCCD).

CREATE TABLE IF NOT EXISTS public.rental_registration_members (
  registration_id   VARCHAR NOT NULL REFERENCES public.rental_registrations(id) ON DELETE CASCADE,
  customer_user_id  UUID NOT NULL REFERENCES public.customers(user_id) ON DELETE CASCADE,
  is_representative  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  -- Một khách hàng chỉ xuất hiện tối đa 1 lần trong cùng 1 phiếu đăng ký.
  PRIMARY KEY (registration_id, customer_user_id)
);

-- PK đã bao cột registration_id (cột dẫn đầu) nên chỉ cần thêm index tra ngược theo khách hàng.
CREATE INDEX IF NOT EXISTS idx_rrm_customer ON public.rental_registration_members(customer_user_id);
