-- 1. Change default value of nationality column in customers table to NULL
ALTER TABLE public.customers ALTER COLUMN nationality DROP DEFAULT;

-- 2. Update existing 'vietnamese' values to 'Việt Nam'
UPDATE public.customers 
SET nationality = 'Việt Nam' 
WHERE nationality = 'vietnamese';

-- 3. Set nationality to NULL for Google OAuth accounts (accounts where cccd is NULL) so that they have to fill it in manually
UPDATE public.customers 
SET nationality = NULL 
WHERE cccd IS NULL;
