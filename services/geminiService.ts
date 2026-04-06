
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Modality } from "@google/genai";
import { DAILY_BREAD } from "../constants";

// Lazy initialization to prevent crash on load if key is missing
let aiInstance: GoogleGenAI | null = null;

const getAiInstance = () => {
    if (!aiInstance) {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || (process.env as any).GEMINI_API_KEY;
        if (!apiKey) {
            console.error("CRITICAL: Gemini API Key is missing in process.env.");
            throw new Error("API key must be set when using the Gemini API.");
        }
        console.log("Initializing AI Instance with model:", TEXT_MODEL);
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
};

/**
 * Valida a conexão com o motor de IA (Smoke Test)
 */
export const checkAiHealth = async (): Promise<boolean> => {
    try {
        const response = await getAiInstance().models.generateContent({
            model: TEXT_MODEL,
            contents: [{ parts: [{ text: "Diga apenas 'OK'" }] }]
        });
        return response.text?.includes('OK') || false;
    } catch (e: any) {
        console.error("AI Health Check failed:", e.message || e);
        return false;
    }
};

const TEXT_MODEL = "gemini-2.0-flash"; 
const IMAGE_MODEL = "gemini-3.1-flash-image-preview"; // Nano Banana 2 (Gemini 3.1 Flash Image)
const PRO_IMAGE_MODEL = "gemini-3-pro-image-preview"; // Nano Banana Pro
const TTS_MODEL = "gemini-2.0-flash";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

// Generic AI Call with Fallbacks (Order: Groq → OpenRouter → Gemini)
export const callAi = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    // 1. Try Groq (primary — free tier, high quota)
    try {
        const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
        if (groqKey) {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemInstruction || "Atue como um conselheiro teológico sábio." },
                        { role: "user", content: prompt }
                    ],
                    response_format: responseFormat === 'json' ? { type: "json_object" } : undefined
                })
            });
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
        }
    } catch (e: any) {
        console.warn("Groq failed, trying OpenRouter...", e.message);
    }

    // 2. Try OpenRouter (secondary — free models available)
    try {
        const orKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        if (orKey) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${orKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://biblialm.com",
                    "X-Title": "BibliaLM"
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        { role: "system", content: systemInstruction || "Atue como um conselheiro teológico sábio." },
                        { role: "user", content: prompt }
                    ]
                })
            });
            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
        }
    } catch (e: any) {
        console.warn("OpenRouter failed, trying Gemini...", e.message);
    }

    // 3. Try Gemini (last resort — preserve quota)
    try {
        const response = await getAiInstance().models.generateContent({
            model: TEXT_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { 
                systemInstruction,
                responseMimeType: responseFormat === 'json' ? "application/json" : undefined
            }
        });
        if (response.text) return response.text;
    } catch (e: any) {
        console.error("Gemini failed in callAi:", e.message || e);
    }

    throw new Error("Não foi possível processar sua solicitação com nenhum provedor de IA no momento.");
};

export const sendMessageToGeminiStream = async (
    history: any[],
    onChunk: (text: string) => void,
    context?: string
) => {
    try {
        const systemInstruction = `Vise atuar como um Pastor Auditor (Obreiro IA).
        DIRETRIZES FUNDAMENTAIS:
        1. TOM: Pastoral, acolhedor, sábio e humilde.
        2. FUNDAMENTAÇÃO: Baseie-se estritamente na verdade bíblica e cite referências (Capítulo e Versículo).
        3. TRANSPARÊNCIA: Diferencie claramente fatos bíblicos de incentivos ou interpretações pastorais.
        4. VERACIDADE: Evite alucinações teológicas. Se algo não estiver na Bíblia, sinalize como interpretação ou admita não saber.
        
        ${context ? `CONTEXTO DE ESTUDO ATUAL: ${context}` : ''}`;

        // Construção do prompt mantendo o histórico
        let prompt = "";
        history.forEach(msg => {
            const role = msg.role === 'user' ? 'Usuário' : 'Pastor/Obreiro';
            prompt += `${role}: ${msg.content}\n`;
        });
        prompt += "Pastor/Obreiro: ";

        const response = await getAiInstance().models.generateContentStream({
            model: TEXT_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { systemInstruction }
        });

        for await (const chunk of response) {
            if (chunk.text) onChunk(chunk.text);
        }
    } catch (error) {
        console.error("Gemini Stream Error:", error);
        onChunk("Desculpe, tive um problema de conexão momentâneo. Como obreiro, sigo à disposição assim que o sistema estabilizar.");
    }
};

export const analyzeUnderstanding = async (userThoughts: string, context: string): Promise<string> => {
    try {
        const prompt = `Analise esta reflexão do usuário sobre o texto: "${userThoughts}". Contexto bíblico: "${context}". Forneça feedback teológico, encorajamento e uma aplicação prática. Responda em HTML simples (p, strong, ul, li). IMPORTANTE: Garanta contraste legível; se usar estilos customizados, assegure que o texto seja escuro em fundos claros.`;
        return await callAi(prompt, undefined, "text");
    } catch (e) {
        return "Erro na análise.";
    }
};

export const generateDailyDevotional = async (
    forceNew: boolean = false,
    options?: { excludedVerseReferences?: string[] }
) => {
    try {
        const forbiddenReferences = options?.excludedVerseReferences?.length
            ? `\n        5. NUNCA reutilize nenhuma destas referências bíblicas: ${options.excludedVerseReferences.join(', ')}.`
            : '';
        const prompt = `Gere um devocional cristão profundo e acolhedor para hoje. 
        REGRAS PASTORAIS:
        1. Baseie-se estritamente na verdade bíblica.
        2. Diferencie claramente fatos bíblicos de incentivo pastoral.
        3. Se houver interpretação, sinalize com humildade.
        4. Cite explicitamente a fonte (capítulo e versículo).
        ${forbiddenReferences}
        
        Inclua: Título, Referência Bíblica (Ex: Salmos 23:1), Texto do Versículo, Conteúdo (Reflexão profunda de 3 parágrafos) e uma Oração final. 
        Retorne em JSON: { title, verseReference, verseText, content, prayer }.`;
        const text = await callAi(prompt, undefined, "json");
        const data = JSON.parse(text || "{}");
        data.date = new Date().toLocaleDateString('pt-BR');
        return data;
    } catch (e) {
        return DAILY_BREAD;
    }
};

export const improveNote = async (content: string): Promise<string> => {
    try {
        const prompt = `Melhore esta anotação bíblica, corrigindo gramática, expandindo ideias teológicas e formatando melhor, mantendo a essência pessoal: "${content}"`;
        return await callAi(prompt, undefined, "text");
    } catch (e) { return content; }
};

export const summarizeNoteForSocial = async (content: string, bookName: string, chapter: number) => {
    try {
        const prompt = `Crie um resumo curto e inspirador (max 280 chars) para compartilhar no feed social, baseado nesta nota sobre ${bookName} ${chapter}: "${content}". Inclua hashtags.`;
        const text = await callAi(prompt, undefined, "text");
        return { summary: text || "", ref: `${bookName} ${chapter}` };
    } catch (e) { return null; }
};

// ... (Generate Sermon, Structured Study, Module etc. keep them)
export const generateSermonOutline = async (contextText: string, theme: string, audience: string, title?: string): Promise<string> => {
    try {
        const prompt = `Crie um esboço de sermão homilético transformador sobre "${theme || 'o texto'}" para ${audience || 'igreja geral'}. 
        Texto base: ${contextText}. 
        
        REGRAS DO PASTOR AUDITOR:
        - Fundamente cada ponto em trechos verificáveis do texto base ou referências bíblicas externas.
        - Diferencie claramente a exegese (fato) da aplicação pastoral (interpretação).
        - Tom pastoral, sábio e acolhedor.
        
        Estrutura OBRIGATÓRIA: 1. Introdução, 2. Contextualização (Contexto histórico, Pontos, Tópicos, Temas), 3. Aplicação Prática, 4. Oração Final. 
        Use formato HTML (h1, h2, p, strong, ul, li).`;
        
        return await callAi(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateSermonIllustration = async (theme: string, context: string): Promise<string> => {
    try {
        const prompt = `Crie uma ilustração (história, metáfora ou exemplo histórico) curta e impactante para um sermão sobre: "${theme}". Contexto bíblico: "${context}". A ilustração deve ajudar a explicar o ponto teológico de forma emocional e memorável. Formato HTML (p). Assegure contraste total (texto #222 se o fundo for claro).`;
        return await callAi(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateSmallGroupQuestions = async (sermonContent: string): Promise<string> => {
    try {
        const prompt = `Com base neste esboço de sermão, crie 5 perguntas para discussão em pequenos grupos (Células/PGs). As perguntas devem estimular a aplicação prática e a comunhão. \n\nSermão: "${sermonContent.substring(0, 1000)}..." \n\nFormato HTML (ul, li, strong).`;
        return await callAi(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateStructuredStudy = async (theme: string, reference: string, audience: string, mode: 'quick' | 'deep') => {
    let imageUrl = '';
    
    try {
        const imageResult = await generateVerseImage(theme, reference, "sacred art oil painting, cinematic lighting");
        if (imageResult) {
            imageUrl = `data:${imageResult.mimeType};base64,${imageResult.data}`;
        }
    } catch (e) {
        console.warn("Erro na geração de imagem IA (removendo bloco de imagem):", e);
    }


    const prompt = `
    Atue como um Pastor Audidtor sábio e humilde. Crie um estudo bíblico direto, acolhedor e profundamente fundamentado.
    Tema central: "${theme}". Público-alvo: "${audience}".
    Referência base: "${reference}". (Se vaga, escolha uma referência canônica perfeita).
    Modo: "${mode === 'quick' ? 'Devocional Rápido' : 'Estudo Pastoral Direto'}".

    REGRAS PASTORAIS (Obrigatoriedade):
    1. FUNDAMENTAÇÃO: Todo ensino deve ser ancorado em Escrituras reais. Cite Capítulo e Versículo.
    2. TRANSPARÊNCIA: Diferencie fatos bíblicos/históricos (exegese) de incentivos ou interpretações pastorais.
    3. TOM: Seja um "Obreiro" servidor. Use um tom natural, humano e empático.
    4. QUALIDADE: Não use placeholders. Se citar um fato histórico, certifique-se de que é verificável.

    ESTRUTURA HTML (Retorne APENAS HTML):
    <h1 class="bible-title">[Título Motivador]</h1>
    <p class="bible-subtitle">[Referência Bíblica Fundamental]</p>
    
    <div class="bible-hero-box" style="background: linear-gradient(to bottom right, #fdfaf5, #fff); border-radius: 20px; padding: 30px; margin-bottom: 30px; border-left: 5px solid #c5a059; color: #333;">
        <h2 class="bible-hero-title" style="color: #c5a059; margin-top: 0;">1. Coração do Ensino</h2>
        <p style="font-size: 1.15em; line-height: 1.7; color: #222;">[Introdução conectando o tema à vida atual do fiel]</p>
    </div>
    
    ${imageUrl ? `
    <!-- Imagem de Destaque 1 -->
    <div style="margin: 40px 0; text-align: center;">
        <img src="${imageUrl}" alt="${theme}" style="width:100%; max-height: 400px; border-radius:24px; object-fit: cover; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" />
    </div>
    ` : ''}
    
    <h2>2. Mergulho nas Escrituras</h2>
    <p>[Explicação bíblica direta e fácil de entender. Vá direto ao ponto teológico sem ser excessivamente acadêmico.]</p>
    
    <blockquote style="border-left: 4px solid #c5a059; background: #fdfaf5; padding: 30px; margin: 40px 0; font-size: 1.3em; font-style: italic; border-radius: 12px; color: #444; position: relative;">
        <span style="font-size: 3em; color: #c5a059; opacity: 0.2; position: absolute; left: 10px; top: -10px;">"</span>
        <span style="color: #222;">[O Texto Bíblico Completo e Formatado]</span>
        <span style="font-size: 3em; color: #c5a059; opacity: 0.2; position: absolute; right: 10px; bottom: -30px;">"</span>
    </blockquote>
    
    <h2>3. Pontos de Transformação</h2>
    <p>[Liste apenas 2 ou 3 pontos práticos e curtos extraídos do texto]</p>
    
    <h2>4. Aplicação Prática</h2>
    <p>[O que fazer com essa palavra hoje? Um desafio simples.]</p>
    <ul class="bible-list" style="list-style: none; padding-left: 0;">
      <li style="background: #fff; padding: 20px; border-radius: 15px; margin-bottom: 15px; border: 1px solid #eee; border-left: 4px solid #c5a059; color: #333;"><strong>Aja:</strong> [Ação concreta e factível].</li>
    </ul>

    <div class="bible-footer-box" style="background: #1a1a1a; color: #fff; border-radius: 25px; padding: 40px; margin-top: 50px; text-align: center;">
        <h2 class="bible-footer-title" style="color: #c5a059; margin-top: 0;">Oração Final</h2>
        <p class="bible-prayer" style="font-size: 1.2em; font-style: italic; color: #ddd;">" [Oração pastoral curta, simples e afetuosa] Amém. "</p>
    </div>
    `;

    try {
        const text = await callAi(prompt, undefined, "text");
        let html = text || "";
        // Remove possible markdown formatting
        html = html.replace(/```html/g, '').replace(/```/g, '').trim();
        return html;
    } catch (e) {
        console.error("AI Generation Error: ", e);
        return "";
    }
};

/*
export const generateThematicModule = async (theme: string) => {
    try {
        const response = await getAiInstance().models.generateContent({
            model: TEXT_MODEL,
            contents: [{ parts: [{ text: `Crie um plano de estudo bíblico de 7 dias sobre "${theme}". 
            REGRAS PASTORAIS: Use tom didático, cite versículos base e segmente por temas edificantes.
            Retorne JSON: { title, description, icon, days: [{ day: number, title: string, shortDescription: string, baseVerses: string[] }] }` }] }],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return null; }
};
*/

export const generateModuleDayContent = async (theme: string, dayTitle: string, verses: string[]) => {
    try {
        const prompt = `Escreva o conteúdo completo de um estudo bíblico sobre "${dayTitle}" dentro do tema "${theme}". Versículos base: ${verses.join(', ')}. Use formato HTML rico com design elegante e contraste garantido (defina explicitamente a cor do texto para qualquer bloco com fundo colorido).`;
        return await callAi(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateBibleQuiz = async (topic: string, difficulty: string) => {
    try {
        const prompt = `Generate 5 bible quiz questions about "${topic}" with difficulty "${difficulty}". 
            REGRAS: As perguntas devem ser baseadas em fatos bíblicos claros, cite a referência na explicação.
            JSON format: [{ id: number, question: string, options: string[], correctIndex: number, explanation: string, reference: string }]`;
        const text = await callAi(prompt, undefined, "json");
        return JSON.parse(text || "[]");
    } catch (e) { return []; }
};

export const analyzeReadingPlanCommitment = async (days: number, scope: string) => {
    try {
        const prompt = `Analise um plano de leitura da Bíblia (${scope}) em ${days} dias. Calcule capítulos/dia, versículos estimados, dificuldade e crie uma frase de compromisso e 3 dicas. JSON: { commitment, tips, difficulty, versesPerDay, strategy }`;
        const result = await callAi(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const suggestReadingPlan = async (userPrompt: string) => {
    try {
        const prompt = `Sugira uma configuração de plano de leitura baseada no pedido: "${userPrompt}". Retorne JSON: { scope: 'all' | 'new_testament' | 'old_testament', days: number }`;
        const result = await callAi(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateReadingConnection = async (refs: string[]) => {
    try {
        const prompt = `Encontre a conexão teological entre estas leituras: ${refs.join(', ')}. Retorne JSON: { theme: string, conclusion: string }`;
        const result = await callAi(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateSuggestedPrayer = async (requestContent: string): Promise<string> => {
    try {
        const prompt = `Atue como um Pastor Auditor intercessor. Escreva uma oração curta (max 3 frases) e profunda intercedendo por: "${requestContent}". Se possível, inclua uma breve menção a uma promessa bíblica.`;
        return await callAi(prompt, undefined, "text");
    } catch (e) { return "Senhor, ouve este clamor e traz consolo segundo a Tua Palavra. Amém."; }
};

export const getBibleChapter = async (bookName: string, chapter: number, version: string = 'ara') => {
    const versionNames: Record<string, string> = {
        'ara': 'Almeida Revista e Atualizada (ARA)',
        'arc': 'Almeida Revista e Corrigida (ARC)',
        'nvi': 'Nova Versão Internacional (NVI)',
        'acf': 'Almeida Corrigida Fiel (ACF)',
        'almeida1917': 'João Ferreira de Almeida (1917)',
    };
    const versionLabel = versionNames[version] || `versão ${version.toUpperCase()}`;
    try {
        const prompt = `Forneça o texto fiel e COMPLETO de ${bookName} capítulo ${chapter} na versão bíblica: ${versionLabel}.
            REGRAS DE INTEGRIDADE ABSOLUTA:
            1. Retorne EXATAMENTE os versículos bíblicos originais desta versão, sem alterações, resumos ou comentários.
            2. Inclua TODOS os versículos do capítulo, do primeiro ao último.
            3. Não invente versos. Se não souber o texto exato, use a versão ARA como base.
            Retorne JSON: { number: ${chapter}, verses: [{ number: number, text: string }] }`;
        const text = await callAi(prompt, undefined, "json");
        return JSON.parse(text || "null");
    } catch (e) { return null; }
};

// --- NEW GENERATORS FOR TRACKS & PRAYERS ---

/*
export const generateThematicTrack = async (theme: string, mood: string) => {
    try {
        const response = await getAiInstance().models.generateContent({
            model: TEXT_MODEL,
            contents: [{
                parts: [{
                    text: `Crie uma trilha de leitura bíblica de 5 passos sobre o tema "${theme}" para alguém se sentindo "${mood}".
            A trilha é para ser incrivelmente consoladora e evoluir a cada passo. É EXTREMAMENTE IMPORTANTE que cada passo aborde um "bookId" e "chapter" diferente, de forma que o usuário não leia os mesmos versículos duas vezes ao longo da jornada. A cada página/passo da trilha, conduza o usuário de maneira progressiva no aprendizado ou na cura emocional. Mostre a progressão da jornada (ex: Início, Meio e Conclusão reveladora)
            Retorne no formato JSON Exato: 
            { 
               "title": "Título Incrível", 
               "description": "Descrição envolvente", 
               "steps": [
                  { 
                     "title": "Título do Passo",
                     "devotionalHtml": "Escreva aqui um pequeno devocional cativante (1 ou 2 parágrafos) em formato HTML (pode usar <b>, <i>, <br>) que introduza o contexto da leitura, mostre como o versículo a seguir vai ajudar o leitor agora neste estágio de sua jornada (ex: 'Ajudará a firmar a fé no começo', 'Te ajudará a encontrar descanso na fase atual').",
                     "commentAuthor": "ai",
                     "bookId": "um_dos_ids_da_biblia_como_gn_sl_mt",
                     "chapter": 1,
                     "referenceString": "ex: Salmos 23"
                  }
               ] 
            }` }]
            }],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) { return null; }
};
*/

/**
 * Gera uma oração específica baseada em um tópico e sentimento.
 */
export const generateSpecificPrayer = async (topic: string, feeling: string): Promise<{ title: string; content: string } | null> => {
    try {
        const prompt = `Escreva o conteúdo de uma oração profunda e pastoral baseada no tópico: "${topic}" e no sentimento: "${feeling}". 
        REGRAS:
        1. Seja profundo, empático e bíblico.
        2. Retorne APENAS um JSON válido.
        3. Formato JSON: { "title": "...", "content": "..." }`;
        
        const text = await callAi(prompt, undefined, "json");
        return JSON.parse(text || "{}");
    } catch (e) { 
        console.error("Erro ao gerar oração específica:", e);
        return null; 
    }
};


// ... (Image, Podcast, Maps logic - keep them)
export const generateImagePromptForPlan = async (title: string, description: string) => {
    try {
        const prompt = `Create a vivid, artistic image prompt for a bible study plan titled "${title}": ${description}. The prompt should be suitable for an image generation model.`;
        return await callAi(prompt, undefined, "text");
    } catch (e) { return null; }
};

// Mapeamento de estilos para queries de imagem em inglês
const STYLE_TO_QUERY: Record<string, string> = {
    'realistic': 'nature spiritual light',
    'oil_painting': 'nature landscape painting',
    'cinematic': 'cinematic nature light',
    'watercolor': 'watercolor nature painting',
    'realista': 'nature spiritual light',
    'óleo': 'oil painting nature',
    'cine': 'cinematic light landscape',
    'aquarela': 'watercolor painting nature',
};

const RELIGIOUS_KEYWORDS: Record<string, string> = {
    'cruz': 'cross light nature spiritual',
    'anjo': 'angel spiritual ethereal light',
    'oração': 'prayer hands light spiritual',
    'deserto': 'desert golden hour spiritual',
    'jardim': 'garden flowers nature peaceful',
    'bíblia': 'bible book old light',
    'céu': 'heavenly sky clouds golden light',
    'estrela': 'starry night sky spiritual',
    'mar': 'calm sea sunset spiritual',
    'leão': 'lion majestic nature',
    'cordeiro': 'lamb nature peaceful',
    'fogo': 'fire light spiritual dramatic',
    'espírito': 'dove bird white light',
    'pomba': 'dove bird white light',
    'israel': 'jerusalem old city landscape',
    'trigo': 'wheat field golden hour',
    'caminho': 'path forest sunlight spiritual',
    'promessa': 'rainbow sky clouds nature',
    'arco-íris': 'rainbow sky clouds nature',
    'tempestade': 'storm clouds dramatic sky sea',
    'calmaria': 'peaceful lake sunrise nature',
    'pastagens': 'green pastures hills nature',
    'reino': 'majestic castle mountain landscape',
    'coroa': 'crown light spiritual',
    'sangue': 'red sunrise dramatic sky',
    'colheita': 'harvest wheat field nature',
    'semeador': 'seeds ground nature sunlight',
};

const getUnsplashFallbackUrl = (text: string, style: string): { url: string; category: string } => {
    const lowerText = text.toLowerCase();
    let query = 'nature spiritual light';
    let category = 'Geral';
    
    // Lista de variações para cada estilo para evitar repetição
    const styleModifiers: Record<string, string[]> = {
        'realistic': ['4k', 'photography', 'ultra hd', 'vibrant'],
        'oil_painting': ['artwork', 'textured', 'fine art', 'canvas'],
        'cinematic': ['moody', 'epic', 'anamorphic', 'dark light'],
        'watercolor': ['soft', 'pastel', 'illustration', 'expressive'],
        'vintage': ['analog', 'film noir', 'faded', 'retro'],
        'minimalist': ['clean', 'simple', 'monochrome', 'space']
    };

    // Categorização por keywords bíblicas
    for (const [keyword, q] of Object.entries(RELIGIOUS_KEYWORDS)) {
        if (lowerText.includes(keyword)) { 
            query = q; 
            category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break; 
        }
    }
    
    // Se não achou keyword, usa o estilo mapeado
    if (query === 'nature spiritual light') {
        const styleInfo = STYLE_TO_QUERY[style.toLowerCase()] || 'nature spiritual landscape';
        query = styleInfo;
        category = 'Estúdio';
    }

    // Adiciona modifier aleatório baseado no estilo para diversificar
    const mods = styleModifiers[style.toLowerCase()] || [];
    if (mods.length > 0) {
        query += ` ${mods[Math.floor(Math.random() * mods.length)]}`;
    }
    
    const sig = Math.floor(Math.random() * 20000);
    const url = `https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80&query=${encodeURIComponent(query)}&sig=${sig}`;
    return { url, category };
};

const unsplashUrlToBase64 = async (url: string): Promise<{ mimeType: string; data: string } | null> => {
    try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({ mimeType: blob.type || 'image/jpeg', data: base64 });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch { return null; }
};

export const generateVerseImage = async (text: string, reference: string, style: string): Promise<{ mimeType: string; data: string; category: string } | null> => {
    const lowerText = text.toLowerCase();
    let category = 'Geral';
    for (const keyword of Object.keys(RELIGIOUS_KEYWORDS)) {
        if (lowerText.includes(keyword)) {
            category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break;
        }
    }

    // 1. Try Gemini Image (paid model — will fail silently on free tier)
    try {
        const prompt = `A high quality, ${style} style religious art representing the bible verse: "${text}" (${reference}). Spiritual, cinematic lighting, masterpiece. 
        IMPORTANT CONSTRAINTS: 
        - NO RED BACKGROUNDS. 
        - NO text, letters, or words on the image itself. 
        - NO frames, borders, or watermarks.
        - Focus ONLY on the image subject. Clean, high-fidelity output.`;
        const response = await getAiInstance().models.generateContent({
            model: IMAGE_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { responseModalities: [Modality.IMAGE] as any }
        });
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                const imgData = part.inlineData?.data;
                const mime = part.inlineData?.mimeType;
                if (imgData && mime) {
                    return { mimeType: mime, data: imgData, category };
                }
            }
        }
        // Caso chegue aqui sem dados, força erro para o fallback
        throw new Error("No image data returned from model");
    } catch (e: any) {
        console.warn('Gemini/Imagen Image failed (likely quota or modality):', e.message || e);
    }

    // 2. Try Pexels (if API key available)
    try {
        const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
        if (pexelsKey) {
            const lowerText = text.toLowerCase();
            let query = 'nature spiritual';
            for (const [keyword, q] of Object.entries(RELIGIOUS_KEYWORDS)) {
                if (lowerText.includes(keyword)) { query = q; break; }
            }
            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
                { headers: { Authorization: pexelsKey } }
            );
            const data = await response.json();
            const photos = data.photos;
            if (photos && photos.length > 0) {
                const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 10))];
                const imgUrl = photo.src.large2x || photo.src.large;
                const result = await unsplashUrlToBase64(imgUrl);
                if (result) return { ...result, category: category || 'Geral' };
            }
        }
    } catch (e) {
        console.warn('Pexels fallback failed, trying Unsplash...', e);
    }

    // 3. Unsplash Source (no API key required — free tier)
    try {
        const fallback = getUnsplashFallbackUrl(text, style);
        const result = await unsplashUrlToBase64(fallback.url);
        if (result) return { ...result, category: fallback.category };
    } catch (e) {
        console.warn('Unsplash fallback also failed:', e);
    }

    return null;
};


export const generateSocialPostDesign = async (text: string, ref: string) => {
    try {
        const prompt = `Suggest a design for a social media post for verse "${ref}". JSON: { gradient: string (css), textColor: string, fontStyle: string, caption: string, hashtags: string[] }`;
        const result = await callAi(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateSocialCaption = async (text: string) => { return ""; };

export const generatePodcastScript = async (sourceText: string, title: string) => {
    try {
        const prompt = `Crie um roteiro de podcast dinâmico sobre "${title}".
        CONTEXTO: Utilize o texto base: "${sourceText}".
        
        PERSONAGENS:
        - Maria: Tom acolhedor, sensível, sábio e pastoral. Ela abre e fecha o programa e traz a aplicação emocional/espiritual.
        - Lucas: Tom claro, didático, estruturado e respeitoso. Ele foca no contexto histórico e na explicação dos versículos.
        
        ESTRUTURA:
        1. Maria saúda os ouvintes (Graça e Paz!).
        2. Lucas explica o texto de forma didática.
        3. Maria e Lucas conversam sobre como aplicar isso no dia a dia.
        4. Maria encerra com uma oração/palavra final.
        
        REGRAS: 
        - Use o formato de DIÁLOGO rotulando claramente quem fala. Ex: "MARIA: ...", "LUCAS: ...".
        - Pelo menos 6 trocas de fala.
        - Tom conversacional, acolhedor e profundo.
        - Mantenha-se fiel às fontes e cite os versículos.`;

        return await callAi(prompt, undefined, "text");
    } catch (e) { return null; }
};

export const generatePodcastAudio = async (script: string): Promise<string | null> => {
    try {
        const response = await getAiInstance().models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: script }] }],
            config: { responseModalities: [Modality.AUDIO] }
        });
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return part.inlineData.data || null;
                }
            }
        }
        return null;
    } catch (e) { return null; }
};

export const generatePodcastCover = async (title: string) => {
    return generateVerseImage(title, "Podcast Cover", "minimalist");
};

export async function* generateChapterAudioStream(text: string) {
    const stream = await getAiInstance().models.generateContentStream({
        model: TTS_MODEL,
        contents: [{ parts: [{ text }] }],
        config: { responseModalities: [Modality.AUDIO] }
    });

    for await (const chunk of stream) {
        // Extrai apenas o dado base64 para o consumidor
        const base64 = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
            yield base64;
        }
    }
}

export interface NearbyPlace { name: string; address: string; }

export const findNearbyChurches = async (lat: number, lng: number): Promise<NearbyPlace[]> => {
    try {
        const response = await getAiInstance().models.generateContent({
            model: TEXT_MODEL,
            contents: [{ parts: [{ text: "List 5 churches nearby." }] }],
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude: lat, longitude: lng }
                    }
                }
            }
        });
        const places: NearbyPlace[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web && chunk.web.title) {
                    places.push({ name: chunk.web.title, address: chunk.web.uri || "Endereço via Maps" });
                }
            });
        }
        return places;
    } catch (e) { return []; }
};

export const generateAIOnePage = async (userPrompt: string, authorName?: string): Promise<any> => {
    const systemInstruction = `Atue como Dr. Marcos, teólogo e designer editorial. 
Crie conteúdo bíblico profundo, elegante e visualmente rico.
DIRETRIZES:
1. Use HTML: <h2>, <h3>, <p>, <strong>, blockquote, ul, li.
2. Estudo profundo (450-600 palavras totais) com contexto histórico e aplicação prática real.
3. Não use cores fixas em textos base (suporte ao Dark Mode).
4. Responda APENAS com JSON válido.`;

    const prompt = `PEDIDO: "${userPrompt}"
AUTOR: "${authorName || 'Pr. Gabriel'}"

Gere uma one-page pastoral completa em JSON:
{
  "meta": { "title": "Título Impactante", "description": "Subtítulo pastoral (15-20 palavras)" },
  "slug": "link-amigavel",
  "blocks": {
    "hero": {
      "title": "Chamada Curta", "subtitle": "Frase inspiradora (20 palavras)",
      "backgroundColor": "#1a2744", "textColor": "#ffffff", "alignment": "center"
    },
    "biblical": { "verse": "Ref", "reference": "Ref", "text": "Texto do versículo", "style": "elegant" },
    "studyContent": {
      "content": "<h2>1. Introdução</h2><p>[Reflexão profunda]</p><h2>2. Contexto e Teologia</h2><p>[Significado]</p><h2>3. Aplicação</h2><p>[Princípios]</p>"
    },
    "authority": { "name": "${authorName || 'Pr. Gabriel'}", "bio": "Bio pastoral." },
    "footer": { "tagline": "Fechamento", "showSocial": true }
  }
}
Importante: O campo studyContent.content deve ter conteúdo real, rico e bíblico.`;

    try {
        const raw = await callAi(prompt, systemInstruction, "json");
        let cleaned = raw;
        if (cleaned.includes('```')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(cleaned);
    } catch (e: any) {
        throw new Error(`Falha ao gerar one-page: ${e.message}`);
    }
};

