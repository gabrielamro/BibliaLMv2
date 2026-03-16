import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insert with new columns...');

    // Create a temporary user to avoid foreign key violation
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: 'test_temp_' + Date.now() + '@example.com',
        password: 'password123',
        email_confirm: true
    });

    if (userError) {
        console.error('❌ User creation failed:', userError.message);
        return;
    }

    const testId = userData.user.id;
    console.log('Created temporary user:', testId);

    const { error } = await supabase.from('profiles').upsert({
        id: testId,
        username: 'test_user_' + Date.now(),
        email: userData.user.email,
        badges: ['test_badge'],
        stats: { test: 1 }
    });

    if (error) {
        console.error('❌ Insert failed:', error.message);
    } else {
        console.log('✅ Insert successful! Columns exist.');
        // Cleanup: delete profile and auth user
        await supabase.from('profiles').delete().eq('id', testId);
        await supabase.auth.admin.deleteUser(testId);
        console.log('🧹 Cleanup successful.');
    }
}

testInsert();
