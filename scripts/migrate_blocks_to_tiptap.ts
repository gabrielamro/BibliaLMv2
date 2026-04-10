import { PrismaClient } from '@prisma/client'; // ou import do Supabase service
import dotenv from 'dotenv';
dotenv.config();

// Se usar node scripts/migrate_blocks_to_tiptap.ts
// Este script converte dados do formato Block[] para o Document Node JSON do Tiptap

const migrateBlocksToTiptap = async () => {
    // Importante: Adapte essa inicialização para o serviço de DB correto do BibliaLM
    console.log("Iniciando migração de blocos antigos para Tiptap JSON...");

    // Exemplo lógico do mapeamento de Block[] antigo -> TipTap JSON
    const convertLegacyBlocksToTiptapJSON = (legacyBlocks: any[]) => {
        return {
            type: 'doc',
            content: legacyBlocks.map(block => ({
                type: 'customBlock',
                attrs: {
                    blockData: block
                }
            }))
        };
    };

    // Aqui deve entrar a query real para tabela de Studies:
    // const studies = await supabase.from('public_studies').select('*');
    // Para cada study onde blocks existe e tiptap_body não existe:
    // const newBody = convertLegacyBlocksToTiptapJSON(JSON.parse(study.blocks));
    // await supabase.from('public_studies').update({ tiptap_body: newBody }).eq('id', study.id);

    console.log("Script draftado com sucesso. Leia os comentários acima para acoplar no Supabase Client.");
};

migrateBlocksToTiptap().catch(console.error);
