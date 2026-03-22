
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('Probing posts table columns...');
    
    // Tentamos inserir com tudo e capturamos o erro
    const { error } = await supabase.from('posts').insert({
        user_id: 'test',
        user_display_name: 'test',
        user_username: 'test',
        content: 'test',
        type: 'reflection',
        destination: 'global',
        church_id: 'test',
        cell_id: 'test',
        image_url: 'test',
        likes_count: 0,
        comments_count: 0,
        liked_by: '[]',
        created_at: new Date().toISOString()
    });
    
    if (error) {
        console.log('Error hints at missing columns:', error.message);
    } else {
        console.log('Minimal post inserted successfully with all fields!');
    }
}

probe();
