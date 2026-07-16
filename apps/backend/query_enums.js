const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mtbhyikorukkxjkrabgt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Ymh5aWtvcnVra3hqa3JhYmd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM3MzgxNywiZXhwIjoyMDk2OTQ5ODE3fQ.Sc4FW0MsEFXUf1Q-nPnrZl8Vf0dimnEcoE7pOzYvU6M');

async function main() {
    const { data: stData } = await supabase.from('assets').select('status');
    const { data: catData } = await supabase.from('assets').select('category');
    
    console.log("Distinct statuses:", [...new Set(stData.map(d => d.status))]);
    console.log("Distinct categories:", [...new Set(catData.map(d => d.category))]);
}
main();
