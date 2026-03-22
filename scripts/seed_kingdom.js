
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BIBLE_BOT = {
    userId: 'bible_bot_system',
    userDisplayName: 'BíbliaLM',
    userUsername: 'biblialm',
    userPhotoURL: 'https://sewwhyxrvkcptchakocc.supabase.co/storage/v1/object/public/uploads/system/logo.png'
};

const fakePosts = [
    {
        ...BIBLE_BOT,
        type: 'reflection',
        content: '📖 João 3:16: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."\n\nReflexão: O amor de Deus é incondicional e transformador. Comece o seu dia lembrando que você é amado!',
        destination: 'global',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
        ...BIBLE_BOT,
        type: 'prayer',
        content: '🙏 "Senhor, coloco diante de Ti todos os jovens que buscam sabedoria e direção. Que a Tua paz, que excede todo o entendimento, guarde os corações e as mentes em Cristo Jesus."',
        destination: 'global',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    },
    {
        ...BIBLE_BOT,
        type: 'feeling',
        content: '😇 Me sentindo extremamente abençoado com a nova atualização do BíbliaLM! Que ferramenta incrível para edificar o Reino.',
        destination: 'global',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
    },
    {
        ...BIBLE_BOT,
        type: 'reflection',
        content: '📍 Check-in em **Igreja Batista Central**\nComunhão preciosa ontem no culto de celebração. "Oh! quão bom e quão suave é que os irmãos vivam em união!" (Salmos 133:1)',
        destination: 'church',
        churchId: 'example-church-id',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
        ...BIBLE_BOT,
        type: 'reflection',
        content: '🏠 Nossa Célula de ontem foi transformadora! Discutimos sobre o Fruto do Espírito e como aplicá-lo em nosso trabalho e estudos.',
        destination: 'cell',
        cellId: 'example-cell-id',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
];

async function seed() {
    console.log('Seed: Iniciando plantio no Reino...');
    for (const post of fakePosts) {
        const { error } = await supabase.from('posts').insert({
            user_id: post.userId,
            user_display_name: post.userDisplayName,
            user_username: post.userUsername,
            user_photo_url: post.userPhotoURL,
            content: post.content,
            type: post.type,
            destination: post.destination,
            church_id: post.churchId || null,
            cell_id: post.cellId || null,
            created_at: post.created_at,
            likes_count: Math.floor(Math.random() * 50),
            comments_count: Math.floor(Math.random() * 10),
            liked_by: JSON.stringify([])
        });
        if (error) console.error('Erro ao inserir post:', error);
        else console.log(`✓ Post de ${post.type} inserido.`);
    }
    console.log('Seed: Reino populado com sucesso!');
}

seed();
