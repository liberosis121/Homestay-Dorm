-- 1. Drop foreign key constraints dynamically from rental_registrations, residency_info that reference customers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            tc.table_name, 
            kcu.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu 
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu 
              ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'customers'
            AND tc.table_name IN ('rental_registrations', 'residency_info')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END;
$$;

-- 2. Drop constraints on customers table
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS khach_hang_pkey;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS khach_hang_user_id_key;

-- 3. Set user_id as primary key and cccd as unique/nullable
ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.customers ADD CONSTRAINT customers_pkey PRIMARY KEY (user_id);
ALTER TABLE public.customers ALTER COLUMN cccd DROP NOT NULL;
ALTER TABLE public.customers ADD CONSTRAINT customers_cccd_key UNIQUE (cccd);

-- 4. Add issue date and place columns
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cccd_issue_date DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cccd_issue_place VARCHAR;

-- 5. Re-create foreign keys referencing cccd
ALTER TABLE public.rental_registrations ADD CONSTRAINT rental_registrations_cccd_fkey FOREIGN KEY (cccd) REFERENCES public.customers(cccd) ON DELETE CASCADE;
ALTER TABLE public.residency_info ADD CONSTRAINT residency_info_cccd_fkey FOREIGN KEY (cccd) REFERENCES public.customers(cccd) ON DELETE CASCADE;
