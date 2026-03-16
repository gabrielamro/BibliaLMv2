import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    console.log('Trying to fix schema via RPC...');
    const { error } = await supabase.rpc('exec_sql', {
        query: 'alter table public.bible_verses alter column embedding type vector(768);'
    });
    if (error) {
        console.error('RPC exec_sql failed:', error.message);
    } else {
        console.log('RPC exec_sql succeeded!');
    }
}
runSql();
