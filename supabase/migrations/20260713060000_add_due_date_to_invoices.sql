-- Han thanh toan cua hoa don duoc CHOT tai thoi diem lap va luu cung hoa don,
-- thay vi moi man hinh tu suy ra mot cong thuc khac nhau (truoc day: trang ke toan tinh
-- 'ngay 10 thang ke tiep' con API khach hang tinh 'ngay 05 cua chinh thang ky', khien hoa don
-- ky 06/2026 lap ngay 13/07/2026 bi hien thi 'Qua han' ngay khi vua phat hanh).
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date date;

-- Backfill hoa don cu theo dung quy tac nghiep vu:
-- 1) Hoa don dinh ky (co ky dien/nuoc): ngay 10 thang ke tiep sau ky, toi thieu ngay lap + 7 ngay.
UPDATE invoices i
SET due_date = GREATEST(
      (to_date(e.billing_period, 'YYYY-MM') + INTERVAL '1 month' + INTERVAL '9 days')::date,
      (i.created_at AT TIME ZONE 'UTC')::date + 7
    )
FROM electricity_water_records e
WHERE e.id = i.water_record_id
  AND i.due_date IS NULL;

-- 2) Hoa don dat coc: han = han thanh toan coc (24h) cua phieu coc.
UPDATE invoices i
SET due_date = (d.payment_deadline AT TIME ZONE 'UTC')::date
FROM deposit_requests d
WHERE d.id = i.deposit_id
  AND i.invoice_type = 'deposit'
  AND i.due_date IS NULL;

-- 3) Hoa don hoan coc / doi soat: han = ngay doi soat.
UPDATE invoices i
SET due_date = r.reconciliation_date::date
FROM refund_reconciliations r
WHERE r.id = i.reconciliation_id
  AND i.due_date IS NULL;

-- 4) Con lai (nhan phong, phat sinh chua gan ky dien nuoc): ngay lap + 3 ngay.
UPDATE invoices
SET due_date = (created_at AT TIME ZONE 'UTC')::date + 3
WHERE due_date IS NULL;

COMMENT ON COLUMN invoices.due_date IS 'Han thanh toan chot luc lap hoa don. Dinh ky: ngay 10 thang ke tiep sau ky ghi chi so, toi thieu ngay lap + 7 ngay. Nhan phong/phat sinh: ngay lap + 3 ngay. Dat coc: han thanh toan coc.';
