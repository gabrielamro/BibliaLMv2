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
            -- Criar tabela de galeria de arte sacra
            CREATE TABLE IF NOT EXISTS public.sacred_art_gallery (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                url TEXT NOT NULL,
                thumbnail_url TEXT,
                prompt TEXT NOT NULL,
                category TEXT DEFAULT 'Geral',
                style TEXT,
                verse_text TEXT,
                verse_reference TEXT,
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- Habilitar RLS
            ALTER TABLE public.sacred_art_gallery ENABLE ROW LEVEL SECURITY;

            -- Políticas de Segurança
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura livre galeria' AND tablename = 'sacred_art_gallery') THEN
                    CREATE POLICY "Leitura livre galeria" ON public.sacred_art_gallery FOR SELECT USING (true);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários adicionam galeria' AND tablename = 'sacred_art_gallery') THEN
                    CREATE POLICY "Usuários adicionam galeria" ON public.sacred_art_gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários editam galeria' AND tablename = 'sacred_art_gallery') THEN
                    CREATE POLICY "Usuários editam galeria" ON public.sacred_art_gallery FOR UPDATE USING (auth.uid() = user_id);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários deletam galeria' AND tablename = 'sacred_art_gallery') THEN
                    CREATE POLICY "Usuários deletam galeria" ON public.sacred_art_gallery FOR DELETE USING (auth.uid() = user_id);
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
