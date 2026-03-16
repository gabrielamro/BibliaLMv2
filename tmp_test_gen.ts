
import { generateStructuredStudy } from './services/geminiService';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testGeneration() {
    console.log("Iniciando geração de estudo com IA...");
    try {
        const result = await generateStructuredStudy("A Criação", "Gênesis 1:1", "Adultos", "deep");
        if (result.includes('data:image/')) {
            console.log("SUCESSO: Estudo gerado com imagem em Base64!");
            // console.log(result.substring(0, 500) + "..."); 
        } else if (result.includes('loremflickr.com')) {
            console.log("AVISO: O sistema caiu no fallback do Flickr. Verifique se o modelo suporta geração de imagens.");
        } else {
            console.log("ERRO: O estudo foi gerado sem imagem ou link de imagem.");
        }
    } catch (e) {
        console.error("ERRO CRÍTICO no teste:", e);
    }
}

testGeneration();
