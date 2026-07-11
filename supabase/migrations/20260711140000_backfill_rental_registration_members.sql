-- Backfill: đảm bảo MỌI phiếu đăng ký thuê (cá nhân lẫn nhóm cũ) đều có NGƯỜI ĐẠI DIỆN
-- trong bảng rental_registration_members.
--
-- Bối cảnh: trước đây chỉ luồng đăng ký NHÓM mới chèn thành viên vào bảng này;
-- luồng đăng ký cá nhân và toàn bộ dữ liệu cũ chưa có dòng nào → vá tại đây để model
-- đồng nhất ("phiếu cá nhân = nhóm 1 người"). Luồng cá nhân về sau đã được sửa để tự chèn.
--
-- Map: rental_registrations.cccd → customers.user_id (cccd là định danh duy nhất của KH).
-- Bỏ qua phiếu có cccd rỗng / TEMP-... (tài khoản chưa hoàn tất hồ sơ) hoặc không khớp customer nào.
-- Idempotent: chạy lại nhiều lần không tạo trùng nhờ ON CONFLICT DO NOTHING.

INSERT INTO public.rental_registration_members (registration_id, customer_user_id, is_representative)
SELECT rr.id, c.user_id, TRUE
FROM public.rental_registrations rr
JOIN public.customers c ON c.cccd = rr.cccd
WHERE rr.cccd IS NOT NULL
  AND rr.cccd <> ''
  AND rr.cccd NOT LIKE 'TEMP-%'
ON CONFLICT (registration_id, customer_user_id) DO NOTHING;
