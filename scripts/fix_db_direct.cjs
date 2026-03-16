
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
    console.error("Missing DATABASE_URL in .env");
    process.exit(1);
}

async function run() {
    const client = new Client({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected successfully to PostgreSQL using DATABASE_URL");
        
        const sql = `
            -- Criar tabela de comentários de planos
            CREATE TABLE IF NOT EXISTS public.plan_comments (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                plan_id uuid REFERENCES public.custom_plans(id) ON DELETE CASCADE,
                day_id text NOT NULL,
                user_id uuid REFERENCES public.profiles(id) NOT NULL,
                user_name text,
                user_photo text,
                content text NOT NULL,
                created_at timestamptz DEFAULT now()
            );

            -- Habilitar RLS
            ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;

            -- Políticas de Segurança
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Comentários são públicos' AND tablename = 'plan_comments') THEN
                    CREATE POLICY "Comentários são públicos" ON public.plan_comments FOR SELECT USING (true);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários comentam em planos' AND tablename = 'plan_comments') THEN
                    CREATE POLICY "Usuários comentam em planos" ON public.plan_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários editam próprios comentários' AND tablename = 'plan_comments') THEN
                    CREATE POLICY "Usuários editam próprios comentários" ON public.plan_comments FOR ALL USING (auth.uid() = user_id);
                END IF;
            END $$;
        `;
        
        await client.query(sql);
        console.log("Commands executed successfully.");

    } catch (err) {
        console.error("Connection/Query Error:", err);
    } finally {
        await client.end();
    }
}

run();
