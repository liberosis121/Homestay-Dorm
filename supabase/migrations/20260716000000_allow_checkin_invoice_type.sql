-- Cho phép invoices.invoice_type nhận thêm các loại mà code đã dùng nhưng ràng buộc CHECK cũ còn thiếu.
-- Nguyên nhân lỗi: luồng lập hóa đơn NHẬN PHÒNG (check-in) insert invoice_type='checkin'
-- (xem checkin-invoice.repo.ts / checkin-invoice.service.ts), nhưng CHECK cũ chỉ cho phép
-- ('deposit','monthly','refund') => insert thất bại, hóa đơn nhận phòng không tạo được.
-- Bổ sung 'checkin' (đang dùng thật) + 'service','liquidation' (đã khai báo trong DbInvoice để đọc)
-- nhằm đồng bộ ràng buộc DB với mã nguồn.

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;

ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_type_check
  CHECK (invoice_type::text = ANY (ARRAY[
    'deposit'::varchar,
    'monthly'::varchar,
    'refund'::varchar,
    'checkin'::varchar,
    'service'::varchar,
    'liquidation'::varchar
  ]::text[]));
