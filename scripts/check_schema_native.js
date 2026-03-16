import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking profiles table structure...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error('❌ Error reading profiles:', error.message);
    } else {
        console.log('✅ Successfully read profiles.');
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, cannot determine columns via SELECT *');
        }
    }
}

check();
