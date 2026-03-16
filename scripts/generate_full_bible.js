
import fs from 'fs';
import https from 'https';

// Mapeamento dos nomes de livros da fonte (thiagobodruk/bible) para os IDs do App (constants.ts)
// A chave é o 'abbrev' vindo do JSON da fonte
const BOOK_MAPPING = {
  'gn': 'gn', 'ex': 'ex', 'lv': 'lv', 'nm': 'nm', 'dt': 'dt',
  'js': 'js', 'jz': 'jz', 'rt': 'rt',
  '1sm': '1sm', '2sm': '2sm', '1rs': '1rs', '2rs': '2rs',
  '1cr': '1cr', '2cr': '2cr', 'ed': 'ed', 'ne': 'ne', 'et': 'et',
  'job': 'jo', 'jó': 'jo', // Fonte usa 'job' ou 'jó', App usa 'jo'
  'sl': 'sl', 'pv': 'pv', 'ec': 'ec', 'ct': 'ct',
  'is': 'is', 'jr': 'jr', 'lm': 'lm', 'ez': 'ez', 'dn': 'dn',
  'os': 'os', 'jl': 'jl', 'am': 'am', 'ob': 'ob', 'jn': 'jn',
  'mq': 'mq', 'na': 'na', 'hc': 'hc', 'sf': 'sf', 'ag': 'ag',
  'zc': 'zc', 'ml': 'ml',
  'mt': 'mt', 'mc': 'mc', 'lc': 'lc',
  'jo': 'joao', // Fonte usa 'jo' para João, App usa 'joao'
  'at': 'at', 'atos': 'at', 'rm': 'rm',
  '1co': '1co', '2co': '2co', 'gl': 'gl', 'ef': 'ef', 'fp': 'fp', 'cl': 'cl',
  '1ts': '1ts', '2ts': '2ts', '1tm': '1tm', '2tm': '2tm', 'tt': 'tt',
  'fm': 'fm', 'hb': 'hb', 'tg': 'tg',
  '1pe': '1pe', '2pe': '2pe', '1jo': '1jo', '2jo': '2jo', '3jo': '3jo',
  'jd': 'jd', 'ap': 'ap'
};

const SOURCE_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/pt_acf.json';

console.log("⬇️  Baixando Bíblia ACF completa...");

https.get(SOURCE_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      console.log("📦 Processando dados...");
      const cleanData = data.replace(/^\uFEFF/, '');
      const rawBible = JSON.parse(cleanData);
      const appBible = [];

      // A fonte vem como [ { abbrev: "gn", chapters: [ ["verso1", "verso2"], ... ], name: "Gênesis" }, ... ]

      for (const book of rawBible) {
        const sourceAbbrev = book.abbrev;
        const targetId = BOOK_MAPPING[sourceAbbrev];

        if (!targetId) {
          console.warn(`⚠️  Livro não mapeado ignorado: ${sourceAbbrev}`);
          continue;
        }

        // Formata para o padrão do App, forçando o ID correto
        appBible.push({
          id: targetId,
          abbrev: targetId, // Garante que a importação use este ID
          name: book.name,
          chapters: book.chapters // Array de Arrays de Strings
        });
      }

      const outputPath = './biblia_completa.json';
      fs.writeFileSync(outputPath, JSON.stringify(appBible, null, 2));

      console.log(`✅ Sucesso! Arquivo criado em: ${outputPath}`);
      console.log(`📊 Total de livros processados: ${appBible.length}`);
      console.log(`👉 Agora vá em /admin no seu app e faça upload deste arquivo (ou use a Importação Automática).`);

    } catch (e) {
      console.error("❌ Erro ao processar JSON:", e.message);
    }
  });

}).on('error', (err) => {
  console.error("❌ Erro no download:", err.message);
});
