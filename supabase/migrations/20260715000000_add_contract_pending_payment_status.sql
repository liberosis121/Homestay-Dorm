-- ============================================================================
-- Rang buoc: hop dong chi CO HIEU LUC ('active') sau khi hoa don nhan phong
-- da duoc thanh toan thanh cong.
--
-- Truoc day managerContractService.createContract dat status='active' ngay luc
-- Sale lap HD => khach hang thay HD "Dang hieu luc" du chua tra dong nao.
-- Tu nay HD moi lap co status='pending_payment', va invoiceService.payInvoice
-- moi nang len 'active' khi hoa don nhan phong chuyen sang 'paid'.
--
-- Migration nay dong bo DU LIEU CU cho khop rang buoc moi.
-- ============================================================================

-- Ha ve 'pending_payment' cac hop dong dang 'active' nhung CHUA co hoa don nhan phong
-- da thanh toan.
--
-- CHOT AN TOAN: chi ap dung cho HD con o DAU luong. Loai tru cac HD da di xa hon trong
-- vong doi (da ban giao tai san => khach da don vao o; hoac da co yeu cau tra phong).
-- Ha nhung HD do ve 'pending_payment' se lam sai lech trang thai: mot HD da tra phong
-- khong the quay lai "cho thanh toan lan dau".
UPDATE contracts c
SET status = 'pending_payment'
WHERE c.status = 'active'
  -- (1) chua co hoa don NHAN PHONG da thanh toan
  --     (hoa don nhan phong = invoice_type 'monthly' + chua gan ky dien/nuoc)
  AND NOT EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.contract_id = c.id
      AND i.invoice_type = 'monthly'
      AND i.water_record_id IS NULL
      AND i.status = 'paid'
  )
  -- (2) chua ban giao tai san (khach chua don vao o)
  AND NOT EXISTS (
    SELECT 1 FROM asset_handovers h WHERE h.contract_id = c.id
  )
  -- (3) chua co yeu cau tra phong
  AND NOT EXISTS (
    SELECT 1 FROM checkouts co WHERE co.contract_id = c.id
  );
