
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log("Testing plan_comments table...");
        const { data, error } = await supabase
            .from('plan_comments')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error("Supabase Error:", error);
        } else {
            console.log("Success! Data sample:", data);
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

test();
