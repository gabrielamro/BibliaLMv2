import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpc() {
    console.log('Checking for exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });

    if (error) {
        console.error('❌ RPC failed:', error.message);
    } else {
        console.log('✅ RPC exec_sql exists! Result:', data);
    }
}

checkRpc();
