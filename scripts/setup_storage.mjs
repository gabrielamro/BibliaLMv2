import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Faltam variáveis de ambiente no arquivo .env (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBucketAndPolicies() {
  console.log("⏳ Verificando buckets no Supabase...");
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    return console.error("❌ Erro ao listar buckets:", listError);
  }

  if (buckets.find(b => b.name === 'uploads')) {
    console.log("✅ O bucket 'uploads' já existe. Verificando acesso público...");
    const { error: updateError } = await supabase.storage.updateBucket('uploads', { public: true });
    if (updateError) {
         console.error("❌ Erro ao atualizar visibilidade do bucket:", updateError);
    } else {
         console.log("✅ Bucket configurado como público com sucesso.");
    }
  } else {
    console.log("⏳ Criando o bucket 'uploads' público...");
    const { data, error } = await supabase.storage.createBucket('uploads', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error("❌ Erro ao criar bucket:", error);
    } else {
      console.log("✅ Bucket 'uploads' (público) criado com sucesso!");
    }
  }
}

createBucketAndPolicies();
