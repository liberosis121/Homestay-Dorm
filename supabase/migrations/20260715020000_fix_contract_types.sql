-- Cập nhật contract_type sang 'short_term' cho tất cả hợp đồng có khoảng cách ngày dưới 12 tháng (ví dụ 6 tháng)
UPDATE public.contracts
SET contract_type = 'short_term'
WHERE EXTRACT(year from AGE(end_date::date, start_date::date)) * 12 + EXTRACT(month from AGE(end_date::date, start_date::date)) < 12;

-- Cập nhật contract_type sang 'long_term' cho tất cả hợp đồng từ 12 tháng trở lên
UPDATE public.contracts
SET contract_type = 'long_term'
WHERE EXTRACT(year from AGE(end_date::date, start_date::date)) * 12 + EXTRACT(month from AGE(end_date::date, start_date::date)) >= 12;
