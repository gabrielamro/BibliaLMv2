
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setup() {
    const email = 'teste@example.com';
    const password = '123456';
    const username = 'teste';

    console.log(`Checking user: ${username} (${email})...`);

    // Try to find user in profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    if (profile) {
        console.log('User profile already exists. Updating password...');
        const { error } = await supabase.auth.admin.updateUserById(profile.id, {
            password: password
        });
        if (error) console.error('Error updating password:', error);
        else console.log('Password updated.');
    } else {
        console.log('User not found. Creating...');
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { displayName: 'Teste User' }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log('Auth user already existed. Trying to find existing auth user...');
                const { data: userData } = await supabase.auth.admin.listUsers();
                const existing = userData.users.find(u => u.email === email);
                if (existing) {
                    console.log('Found existing auth user. Ensuring profile exists...');
                    await supabase.from('profiles').upsert({
                        id: existing.id,
                        username: username,
                        display_name: 'Teste User',
                        email: email
                    });
                }
            } else {
                console.error('Error creating auth user:', authError);
                return;
            }
        } else if (authUser.user) {
            console.log('Auth user created. Creating profile...');
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authUser.user.id,
                username: username,
                display_name: 'Teste User',
                email: email
            });
            if (profileError) console.error('Error creating profile:', profileError);
            else console.log('Profile created.');
        }
    }
}

setup().catch(console.error);
