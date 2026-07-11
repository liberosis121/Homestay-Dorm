DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'contracts'
    LOOP
        RAISE NOTICE 'CUSTOM_NOTICE: Column % Type %', r.column_name, r.data_type;
    END LOOP;
END;
$$;
