import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.NEXT_PUBLIC_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('❌ Erro: Variáveis de ambiente faltando no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenAI({ apiKey: geminiKey });

async function seedBible() {
    console.log('🚀 Iniciando Migração da Bíblia para Supabase (Modo Robusto + Resumo)...');

    try {
        if (!fs.existsSync('./biblia_completa.json')) {
            console.error('❌ Arquivo biblia_completa.json não encontrado. Rode scripts/generate_full_bible.js primeiro.');
            return;
        }
        const bibleData = JSON.parse(fs.readFileSync('./biblia_completa.json', 'utf8'));

        console.log('📚 Garantindo tabelas limpas e livros prontos...');
        // Books seeding
        const books = bibleData.map(b => ({
            id: b.id,
            name: b.name,
            testament: b.id === 'mt' || bibleData.indexOf(b) >= 39 ? 'new' : 'old'
        }));

        const { error: errorBooks } = await supabase.from('bible_books').upsert(books);
        if (errorBooks) throw errorBooks;
        console.log(`✅ Livros processados.`);

        // Dimension Check
        let vectorDimension = 1536; // Default from apply_schema.cjs
        try {
            const { error: testErr } = await supabase.from('bible_verses').insert({
                book_id: 'gn', chapter: 1, verse: 9999, text: 'test',
                embedding: new Array(768).fill(0)
            });
            if (!testErr) {
                vectorDimension = 768;
                console.log('✅ Banco configurado para 768 dimensões.');
                await supabase.from('bible_verses').delete().eq('verse', 9999);
            } else if (testErr.message.includes('1536')) {
                vectorDimension = 1536;
                console.log('⚠️ Banco exige 1536 dimensões. Aplicando padding nos vetores de 768.');
                await supabase.from('bible_verses').delete().eq('verse', 9999);
            }
        } catch (e) { }

        console.log(`📖 Processando Versículos com Vetores de ${vectorDimension}D...`);
        let totalProcessed = 0;
        let totalInserted = 0;
        const batchSize = 50;

        for (const book of bibleData) {
            console.log(`   - Verificando ${book.name}...`);

            for (let cIdx = 0; cIdx < book.chapters.length; cIdx++) {
                const chapterNum = cIdx + 1;
                const chapterVerses = book.chapters[cIdx];

                // 1. Verificar progresso do capítulo
                const { data: existingVerses, error: checkError } = await supabase
                    .from('bible_verses')
                    .select('verse, embedding')
                    .eq('book_id', book.id)
                    .eq('chapter', chapterNum);

                if (checkError) {
                    console.error(`      ❌ Erro ao verificar cap ${chapterNum}:`, checkError.message);
                    continue;
                }

                const existingMap = new Map(existingVerses.map(v => [v.verse, v.embedding]));

                const pending = [];
                for (let vIdx = 0; vIdx < chapterVerses.length; vIdx++) {
                    const verseNum = vIdx + 1;
                    if (!existingMap.has(verseNum) || existingMap.get(verseNum) === null) {
                        pending.push({ num: verseNum, text: chapterVerses[vIdx] });
                    }
                }

                if (pending.length === 0) {
                    totalProcessed += chapterVerses.length;
                    continue;
                }

                console.log(`      📝 Processando ${pending.length} versículos no cap ${chapterNum}...`);

                for (let i = 0; i < pending.length; i += batchSize) {
                    const batch = pending.slice(i, i + batchSize);
                    let embeddings = [];
                    let success = false;
                    let retries = 0;

                    while (!success && retries < 5) {
                        try {
                            const result = await genAI.models.embedContent({
                                model: "gemini-embedding-001",
                                contents: batch.map(v => v.text)
                            });

                            embeddings = result.embeddings.map(e => {
                                let values = e.values;
                                if (vectorDimension === 1536) {
                                    // Padding para 1536 se necessário
                                    return [...values, ...new Array(1536 - 768).fill(0)];
                                }
                                return values;
                            });

                            success = true;
                            // Throttling: 1 request/sec = 60 RPM (seguro contra o limite de 100)
                            await new Promise(r => setTimeout(r, 1000));
                        } catch (e) {
                            if (e.message.includes('429') || e.message.includes('Quota')) {
                                const waitTime = (retries + 1) * 30000;
                                console.warn(`      ⏳ Cota atingida. Aguardando ${waitTime / 1000}s (Tentativa ${retries + 1})...`);
                                await new Promise(r => setTimeout(r, waitTime));
                                retries++;
                            } else {
                                console.error(`      ❌ Erro Crítico API Gemini:`, e.message);
                                embeddings = new Array(batch.length).fill(null);
                                success = true;
                            }
                        }
                    }

                    const toUpsert = batch.map((v, idx) => ({
                        book_id: book.id,
                        chapter: chapterNum,
                        verse: v.num,
                        text: v.text,
                        embedding: embeddings[idx]
                    }));

                    const { error } = await supabase.from('bible_verses').upsert(toUpsert, {
                        onConflict: 'book_id, chapter, verse'
                    });

                    if (error) {
                        console.error(`      ❌ Erro ao salvar:`, error.message);
                    } else {
                        totalInserted += batch.length;
                    }
                }

                totalProcessed += chapterVerses.length;
                if (totalProcessed % 500 < 100) {
                    console.log(`      📊 Progresso global: ${totalProcessed} versículos verificados.`);
                }
            }
        }

        console.log(`\n🎉 Migração finalizada.`);
        console.log(`📊 Total lido/conferido: ${totalProcessed}`);
        console.log(`📊 Total inserido/corrigido: ${totalInserted}`);

    } catch (error) {
        console.error('❌ Falha na migração:', error.message);
    }
}

seedBible();
