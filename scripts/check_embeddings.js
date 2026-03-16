import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
    const { count, error } = await supabase.from('bible_verses').select('*', { count: 'exact', head: true }).is('embedding', null);
    if (error) console.error(error.message);
    else console.log('Verses with NULL Embedding:', count);
}
check();
