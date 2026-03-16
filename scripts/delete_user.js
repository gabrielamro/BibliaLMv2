import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteUser(userId) {
    if (!userId) {
        console.error('❌ Defina o ID do usuário: node scripts/delete_user.js <USER_ID>');
        return;
    }

    console.log(`🗑️  Excluindo usuário: ${userId}...`);

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        console.error('❌ Erro ao deletar usuário:', error.message);
    } else {
        console.log('✅ Usuário deletado com sucesso!');
    }
}

const userId = process.argv[2];
deleteUser(userId);
