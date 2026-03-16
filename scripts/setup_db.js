import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addUniqueConstraint() {
    console.log('🛡️ Adicionando restrição UNIQUE (book_id, chapter, verse)...');
    const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.bible_verses ADD CONSTRAINT bible_verses_unique_verse UNIQUE (book_id, chapter, verse);'
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('✅ Restrição UNIQUE já existe.');
        } else {
            console.error('❌ Erro ao adicionar restrição:', error.message);
            console.log('⚠️ Tentativa via query direta (pode falhar se RPC não existir):');
            // Supabase client doesn't expose raw SQL easily without RPC or similar.
            // If RPC doesn't exist, we might have to tell the user to run it in SQL Editor.
        }
    } else {
        console.log('✅ Restrição UNIQUE adicionada com sucesso!');
    }
}

addUniqueConstraint();
