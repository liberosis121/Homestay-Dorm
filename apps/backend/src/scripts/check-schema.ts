import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mtbhyikorukkxjkrabgt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('No Supabase key found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { error: insertErr } = await supabase.from('customers').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    full_name: 'test',
    phone: '',
    email: 'test@test.com'
  });
  console.log('Insert error with email:', insertErr);
}
checkSchema();
