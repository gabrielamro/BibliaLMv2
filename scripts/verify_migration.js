import { dbService as firebaseDb } from './services/firebase.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configurados no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCollection(collectionName, supabaseTable) {
    console.log(`\n🔍 Verificando: Firestore [${collectionName}] ➔ Supabase [${supabaseTable}]`);

    try {
        // 1. Firebase (Limitado para não pesar)
        console.log(`   📡 Lendo Firebase...`);
        // Nota: O dbService do projeto as vezes exige UID, vamos tentar o getAllUsers para testar 'users'
        let firebaseCount = 0;
        if (collectionName === 'users') {
            const docs = await firebaseDb.getAllUsers();
            firebaseCount = docs.length;
        } else {
            // Para outras coleções, o dbService atual é mais complexo. 
            // Em uma migração real, usaríamos o SDK do Firebase Admin aqui.
            console.log(`   ⚠️  Atenção: Contagem direta para '${collectionName}' requer Firebase Admin.`);
        }

        // 2. Supabase
        const { count, error } = await supabase
            .from(supabaseTable)
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        console.log(`   📊 Resultados:`);
        console.log(`      - Firebase: ~${firebaseCount} (via Client SDK)`);
        console.log(`      - Supabase: ${count} registros`);

        if (firebaseCount === count && count > 0) {
            console.log(`   ✅ Sincronizado!`);
        } else if (count > 0) {
            console.log(`   🟡 Diferença detectada ou contagem parcial.`);
        } else {
            console.log(`   ⚪ Tabela vazia no Supabase.`);
        }

    } catch (error) {
        console.error(`   ❌ Erro na auditoria de ${collectionName}:`, error.message);
    }
}

async function run() {
    console.log('=========================================');
    console.log('🛡️ AUDITORIA DE INTEGRIDADE DE MIGRAÇÃO');
    console.log('=========================================\n');

    await verifyCollection('users', 'profiles');
    await verifyCollection('posts', 'posts');
    await verifyCollection('prayer_requests', 'prayer_requests');

    console.log('\n✅ Fim da verificação.');
}

run();
