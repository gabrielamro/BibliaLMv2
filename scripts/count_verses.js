import { createClient } from '@supabase/supabase-js';
// Env via flag
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function count() {
    const { count, error } = await supabase.from('bible_verses').select('*', { count: 'exact', head: true });
    if (error) console.error(error.message);
    else console.log('Current Verses:', count);
}
count();
