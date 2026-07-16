-- 1. Set nationality to NULL for the specific accounts mentioned by the user
UPDATE public.customers 
SET nationality = NULL 
WHERE full_name IN ('Lê Lâm Trí Đức', 'Neko Lê', 'Trần Kim Yến');

-- 2. Set nationality to NULL for any customer who does not have an active, expired, or terminated contract
UPDATE public.customers 
SET nationality = NULL 
WHERE user_id NOT IN (
    SELECT DISTINCT cust.user_id 
    FROM public.contracts con
    JOIN public.deposit_requests dep ON con.deposit_id = dep.id
    JOIN public.rental_registrations rent ON dep.registration_id = rent.id
    JOIN public.customers cust ON rent.cccd = cust.cccd
    WHERE con.status IN ('active', 'expired', 'terminated')
);
