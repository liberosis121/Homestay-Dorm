const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('invoice_type', 'refund');
  
  console.log('All refund invoices:', invoices);
}

main();
