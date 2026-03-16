
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = ['plan_comments', 'post_comments', 'comments', 'study_comments'];
    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`  Table ${table} error: ${error.message} (${error.code})`);
        } else {
            console.log(`  Table ${table} EXISTS!`);
        }
    }
}

checkTables();
