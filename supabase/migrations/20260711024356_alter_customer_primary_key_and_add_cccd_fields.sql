DO $$
DECLARE
    r RECORD;
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['rental_registrations', 'contracts', 'residency_info']
    LOOP
        FOR r IN 
            SELECT conname, pg_get_constraintdef(oid) as def
            FROM pg_constraint 
            WHERE conrelid = ('public.' || t)::regclass
        LOOP
            RAISE NOTICE 'CUSTOM_NOTICE: Table % Constraint % Def %', t, r.conname, r.def;
        END LOOP;
    END LOOP;
END;
$$;
