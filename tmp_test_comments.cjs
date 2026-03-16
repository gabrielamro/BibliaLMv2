
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env manually since dotenv might not be available or we want to be sure
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        console.log("Testing plan_comments table...");
        const { data, error } = await supabase
            .from('plan_comments')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error("Supabase Error:", JSON.stringify(error, null, 2));
        } else {
            console.log("Success! Data sample:", data);
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

test();
