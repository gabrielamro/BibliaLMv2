import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTempUser() {
    const email = `temp_user_${Date.now()}@example.com`;
    const password = 'TempPassword123!';

    console.log(`🚀 Criando usuário temporário: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            role: 'test_user',
            created_at: new Date().toISOString()
        }
    });

    if (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        return;
    }

    const user = data.user;
    console.log('✅ Usuário criado com sucesso!');
    console.log('------------------------------------');
    console.log(`ID:       ${user.id}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${password}`);
    console.log('------------------------------------');
    console.log('⚠️  Lembre-se de deletar este usuário após os testes ou guarde o ID para referências em chaves estrangeiras.');
}

createTempUser();
