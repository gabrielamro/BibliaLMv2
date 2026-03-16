import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function clean() {
    console.log('🗑️ Cleaning bible_verses...');
    const { error: error1 } = await supabase.from('bible_verses').delete().neq('id', 0);
    if (error1) console.error('Error cleaning verses:', error1.message);

    console.log('🗑️ Cleaning bible_books...');
    const { error: error2 } = await supabase.from('bible_books').delete().neq('id', '');
    if (error2) console.error('Error cleaning books:', error2.message);

    console.log('✅ Clean up complete.');
}
clean();
