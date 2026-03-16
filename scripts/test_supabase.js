import { createClient } from '@supabase/supabase-js';
// Native env support used via --env-file

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error } = await supabase.from('bible_books').select('count', { count: 'exact', head: true });
    if (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('Note: This might be because the keys are not JWTs or the table doesn\'t exist yet.');
    } else {
        console.log('✅ Connection successful! Rows in bible_books:', data);
    }
}

test();
