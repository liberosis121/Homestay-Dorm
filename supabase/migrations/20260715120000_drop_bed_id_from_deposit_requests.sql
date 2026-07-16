-- Chuyen phieu dat coc sang quan he n-n voi giuong: moi giuong giu cho nam trong bang noi
-- deposit_beds (coc 1 giuong le = 1 dong, coc nhom = N dong, coc nguyen phong = 0 dong).
--
-- Truoc khi chay: backfill du lieu cu tu cot bed_id vao deposit_beds:
--   INSERT INTO public.deposit_beds (deposit_id, bed_id)
--   SELECT id, bed_id FROM public.deposit_requests
--   WHERE bed_id IS NOT NULL
--   ON CONFLICT (deposit_id, bed_id) DO NOTHING;
--
-- Bo cot deposit_requests.bed_id (tu dong bo luon khoa ngoai deposit_requests_bed_id_fkey).
-- Loai coc nay suy ra tu SO dong trong deposit_beds, khong con dua vao bed_id.

ALTER TABLE public.deposit_requests DROP COLUMN IF EXISTS bed_id;
