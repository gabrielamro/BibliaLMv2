
const { generateStructuredStudy } = require('./services/geminiService');
require('dotenv').config();

async function testGeneration() {
    console.log("Iniciando geração de estudo com IA...");
    try {
        const result = await generateStructuredStudy("A Criação", "Gênesis 1:1", "Adultos", "deep");
        if (result.includes('data:image/')) {
            console.log("SUCESSO: Estudo gerado com imagem em Base64!");
        } else if (result.includes('loremflickr.com')) {
            console.log("AVISO: O sistema caiu no fallback do Flickr.");
        } else {
            console.log("ERRO: O estudo foi gerado sem imagem ou link de imagem.");
        }
    } catch (e) {
        console.error("ERRO CRÍTICO no teste:", e);
    }
}

testGeneration();
