import { GoogleGenAI } from "@google/genai";
import { DAILY_BREAD } from "../constants";

const BIGPICKLE_API_KEY = process.env.NEXT_PUBLIC_BIGPICKLE_API_KEY;
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

const BIGPICKLE_MODEL = "big-pickle";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

const SYSTEM_INSTRUCTION = "Atue como um conselheiro teológico sábio e pastoral. Baseie-se na Bíblia, cite referências (capítulo e versículo), seja acolhedor e diferencie fatos bíblicos de interpretações.";

const callBigPickle = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    if (!BIGPICKLE_API_KEY) throw new Error("BigPickle API Key não configurada");

    const response = await fetch("https://opencode.ai/zen/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${BIGPICKLE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: BIGPICKLE_MODEL,
            messages: [
                { role: "system", content: systemInstruction || SYSTEM_INSTRUCTION },
                { role: "user", content: prompt }
            ],
            max_tokens: 4096,
            ...(responseFormat === 'json' && { response_format: { type: "json_object" } })
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na API BigPickle");
    return data.choices?.[0]?.message?.content || "";
};

const callGroq = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    if (!GROQ_API_KEY) throw new Error("Groq API Key não configurada");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemInstruction || SYSTEM_INSTRUCTION },
                { role: "user", content: prompt }
            ],
            max_tokens: 4096,
            ...(responseFormat === 'json' && { response_format: { type: "json_object" } })
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na API Groq");
    return data.choices?.[0]?.message?.content || "";
};

const callOpenRouter = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API Key não configurada");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://biblialm.com",
            "X-Title": "BibliaLM"
        },
        body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: [
                { role: "system", content: systemInstruction || SYSTEM_INSTRUCTION },
                { role: "user", content: prompt }
            ],
            max_tokens: 4096,
            ...(responseFormat === 'json' && { response_format: { type: "json_object" } })
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro na API OpenRouter");
    return data.choices?.[0]?.message?.content || "";
};

const callGemini = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || (process.env as any).GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key não configurada");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig: {
                responseMimeType: responseFormat === 'json' ? "application/json" : undefined,
                maxOutputTokens: 4096
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || `Erro no Gemini (HTTP ${response.status})`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini não retornou texto");
    return text;
};

export const callAI = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    const providers = [
        { name: 'BigPickle', fn: () => callBigPickle(prompt, systemInstruction, responseFormat) },
        { name: 'Gemini', fn: () => callGemini(prompt, systemInstruction, responseFormat) },
        { name: 'Groq', fn: () => callGroq(prompt, systemInstruction, responseFormat) },
        { name: 'OpenRouter', fn: () => callOpenRouter(prompt, systemInstruction, responseFormat) }
    ];

    const errors: string[] = [];
    for (const provider of providers) {
        try {
            console.log(`[AI] Tentando ${provider.name}...`);
            const result = await provider.fn();
            console.log(`[AI] Sucesso com ${provider.name}`);
            return result;
        } catch (e: any) {
            let msg = e.message || 'Erro Desconhecido';
            if (e.name === 'TypeError' && msg.includes('fetch')) {
                msg = "Falha de Rede/CORS (Verifique sua internet ou desative o AdBlock para este site)";
            }
            console.warn(`[AI] ${provider.name} falhou:`, msg);
            errors.push(`${provider.name}: ${msg}`);
        }
    }

    throw new Error(`Todos os provedores de IA falharam. Detalhes: ${errors.join('; ')}`);
};

export const checkBigPickleHealth = async (): Promise<boolean> => {
    try {
        const response = await callAI("Responda apenas 'OK'");
        return response.toLowerCase().includes('ok');
    } catch (e) {
        console.error("AI Health Check failed:", e);
        return false;
    }
};

export const analyzeUnderstanding = async (userThoughts: string, context: string): Promise<string> => {
    try {
        const prompt = `Analise esta reflexão do usuário sobre o texto: "${userThoughts}". Contexto bíblico: "${context}". Forneça feedback teológico, encorajamento e uma aplicação prática. Responda em HTML simples (p, strong, ul, li).`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return "Erro na análise."; }
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
        const text = await callAI(prompt, undefined, "json");
        const data = JSON.parse(text || "{}");
        data.date = new Date().toLocaleDateString('pt-BR');
        return data;
    } catch (e) { return DAILY_BREAD; }
};

export const improveNote = async (content: string): Promise<string> => {
    try {
        const prompt = `Melhore esta anotação bíblica, corrigindo gramática, expandindo ideias teológicas e formatando melhor, mantendo a essência pessoal: "${content}"`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return content; }
};

export const summarizeNoteForSocial = async (content: string, bookName: string, chapter: number) => {
    try {
        const prompt = `Crie um resumo curto e inspirador (max 280 chars) para compartilhar no feed social, baseado nesta nota sobre ${bookName} ${chapter}: "${content}". Inclua hashtags.`;
        const text = await callAI(prompt, undefined, "text");
        return { summary: text || "", ref: `${bookName} ${chapter}` };
    } catch (e) { return null; }
};

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
        
        return await callAI(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateSermonIllustration = async (theme: string, context: string): Promise<string> => {
    try {
        const prompt = `Crie uma ilustração (história, metáfora ou exemplo histórico) curta e impactante para um sermão sobre: "${theme}". Contexto bíblico: "${context}". A ilustração deve ajudar a explicar o ponto teológico de forma emocional e memorável. Formato HTML (p).`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateSmallGroupQuestions = async (sermonContent: string): Promise<string> => {
    try {
        const prompt = `Com base neste esboço de sermão, crie 5 perguntas para discussão em pequenos grupos (Células/PGs). As perguntas devem estimular a aplicação prática e a comunhão. 

Sermão: "${sermonContent.substring(0, 1000)}..." 

Formato HTML (ul, li, strong).`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateStructuredStudy = async (theme: string, reference: string, audience: string, mode: 'quick' | 'deep'): Promise<string> => {
    const prompt = `
    Atua como um Pastor Auditor sábio e humilde. Crie um estudo bíblico direto, acolhedor e profundamente fundamentado.
    Tema central: "${theme}". Público-alvo: "${audience}".
    Referência base: "${reference}". (Se vaga, escolha uma referência canônica perfeita).
    Modo: "${mode === 'quick' ? 'Devocional Rápido' : 'Estudo Pastoral Direto'}".

    REGRAS PASTORAIS (Obrigatoriedade):
    1. FUNDAMENTAÇÃO: Todo ensino deve ser ancorado em Escrituras reais. Cite Capítulo e Versículo.
    2. TRANSPARÊNCIA: Diferencie fatos bíblicos/históricos (exegese) de incentivos ou interpretações pastorais.
    3. TOM: Seja um "Obreiro" servidor. Use um tom natural, humano e empático.
    4. QUALIDADE: Não use placeholders.

    ESTRUTURA HTML (Retorne APENAS HTML):
    <h1 class="bible-title">[Título Motivador]</h1>
    <p class="bible-subtitle">[Referência Bíblica Fundamental]</p>
    <div class="bible-hero-box">...</div>
    <h2>2. Mergulho nas Escrituras</h2>
    <blockquote>...</blockquote>
    <h2>3. Pontos de Transformação</h2>
    <h2>4. Aplicação Prática</h2>
    <ul class="bible-list">...</ul>
    <div class="bible-footer-box">Oração Final</div>
    `;

    try {
        const text = await callAI(prompt, undefined, "text");
        return text.replace(/```html/g, '').replace(/```/g, '').trim();
    } catch (e) { return ""; }
};

export const generateModuleDayContent = async (theme: string, dayTitle: string, verses: string[]) => {
    try {
        const prompt = `Escreva o conteúdo completo de um estudo bíblico sobre "${dayTitle}" dentro do tema "${theme}". Versículos base: ${verses.join(', ')}. Use formato HTML rico.`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateBibleQuiz = async (topic: string, difficulty: string) => {
    try {
        const prompt = `Generate 5 bible quiz questions about "${topic}" with difficulty "${difficulty}". 
            REGRAS: As perguntas devem ser baseadas em fatos bíblicos claros, cite a referência na explicação.
            JSON format: [{ id: number, question: string, options: string[], correctIndex: number, explanation: string, reference: string }]`;
        const text = await callAI(prompt, undefined, "json");
        return JSON.parse(text || "[]");
    } catch (e) { return []; }
};

export const analyzeReadingPlanCommitment = async (days: number, scope: string) => {
    try {
        const prompt = `Analise um plano de leitura da Bíblia (${scope}) em ${days} dias. Calcule capítulos/dia, versículos estimados, dificuldade e crie uma frase de compromisso e 3 dicas. JSON: { commitment, tips, difficulty, versesPerDay, strategy }`;
        const result = await callAI(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const suggestReadingPlan = async (userPrompt: string) => {
    try {
        const prompt = `Sugira uma configuração de plano de leitura baseada no pedido: "${userPrompt}". Retorne JSON: { scope: 'all' | 'new_testament' | 'old_testament', days: number }`;
        const result = await callAI(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateReadingConnection = async (refs: string[]) => {
    try {
        const prompt = `Encontre a conexão teológica entre estas leituras: ${refs.join(', ')}. Retorne JSON: { theme: string, conclusion: string }`;
        const result = await callAI(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateSuggestedPrayer = async (requestContent: string): Promise<string> => {
    try {
        const prompt = `Atue como um Pastor Auditor intercessor. Escreva uma oração curta (max 3 frases) e profunda intercedendo por: "${requestContent}". Se possível, inclua uma breve menção a uma promessa bíblica.`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return "Senhor, ouve este clamor e traz consolo segundo a Tua Palavra. Amém."; }
};

export const getBibleChapter = async (bookName: string, chapter: number) => {
    try {
        const prompt = `Forneça o texto fiel e completo de ${bookName} capítulo ${chapter} na versão Almeida Revista e Corrigida (ARC). 
            REGRA DE INTEGRIDADE: Retorne exatamente os versículos bíblicos sem alterações, resumos ou comentários. 
            Retorne JSON: { number: number, verses: [{ number: number, text: string }] }`;
        const text = await callAI(prompt, undefined, "json");
        return JSON.parse(text || "null");
    } catch (e) { return null; }
};

export const generateSpecificPrayer = async (topic: string, feeling: string): Promise<{ title: string; content: string } | null> => {
    try {
        const prompt = `Escreva o conteúdo de uma oração profunda e pastoral baseada no tópico: "${topic}" e no sentimento: "${feeling}". 
        REGRAS:
        1. Seja profundo, empático e bíblico.
        2. Retorne APENAS um JSON válido.
        3. Formato JSON: { "title": "...", "content": "..." }`;
        
        const text = await callAI(prompt, undefined, "json");
        return JSON.parse(text || "{}");
    } catch (e) { return null; }
};

export const generateImagePromptForPlan = async (title: string, description: string) => {
    try {
        const prompt = `Create a vivid, artistic image prompt for a bible study plan titled "${title}": ${description}. The prompt should be suitable for an image generation model.`;
        return await callAI(prompt, undefined, "text");
    } catch (e) { return null; }
};

export const generateSocialPostDesign = async (text: string, ref: string) => {
    try {
        const prompt = `Suggest a design for a social media post for verse "${ref}". JSON: { gradient: string (css), textColor: string, fontStyle: string, caption: string, hashtags: string[] }`;
        const result = await callAI(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generatePodcastScript = async (sourceText: string, title: string) => {
    try {
        const prompt = `Crie um roteiro de podcast dinâmico sobre "${title}".
        CONTEXTO: Utilize o texto base: "${sourceText}".
        
        PERSONAGENS:
        - Maria: Tom acolhedor, sensível, sábio e pastoral.
        - Lucas: Tom claro, didático, estruturado e respeitoso.
        
        ESTRUTURA:
        1. Maria saúda os ouvintes (Graça e Paz!).
        2. Lucas explica o texto de forma didática.
        3. Maria e Lucas conversam sobre como aplicar isso no dia a dia.
        4. Maria encerra com uma oração/palavra final.
        
        REGRAS: 
        - Use o formato de DIÁLOGO rotulando claramente quem fala. Ex: "MARIA: ...", "LUCAS: ...".
        - Pelo menos 6 trocas de fala.
        - Tom conversacional, acolhedor e profundo.`;

        return await callAI(prompt, undefined, "text");
    } catch (e) { return null; }
};

export const chatWithPastor = async (history: { role: string; content: string }[], context?: string): Promise<string> => {
    try {
        const systemInstruction = `Você é o Pastor Auditor (Obreiro IA) do BibliaLM.
DIRETRIZES:
1. TOM: Pastoral, acolhedor, sábio e humilde.
2. FUNDAMENTAÇÃO: Baseie-se na verdade bíblica e cite referências (capítulo e versículo).
3. TRANSPARÊNCIA: Diferencie fatos bíblicos de interpretações.
4. VERACIDADE: Se algo não estiver na Bíblia, sinalize ou admita não saber.

${context ? `CONTEXTO: ${context}` : ''}`;

        const prompt = history.map(msg => `${msg.role === 'user' ? 'Usuário' : 'Pastor'}: ${msg.content}`).join('\n') + '\nPastor: ';
        
        return await callAI(prompt, systemInstruction, "text");
    } catch (e) {
        return "Desculpe, tive um problema de conexão momentâneo. Como obreiro, sigo à disposição assim que o sistema estabilizar.";
    }
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
      "content": "<h2>1. Introdução</h2><p>[Reflexão profunda ~100 palavras]</p><h2>2. Contexto e Teologia</h2><p>[Contexto histórico e significado ~150 palavras]</p><blockquote>Frase de impacto</blockquote><h2>3. Aplicação para a Vida</h2><p>[3 princípios práticos ~150 palavras]</p><h2>4. Oração Pastoral</h2><p>[Oração fervorosa ~60 palavras]</p><h2>5. Conclusão</h2><p>[Fechamento inspirador ~60 palavras]</p>"
    },
    "authority": { "name": "${authorName || 'Pr. Gabriel'}", "bio": "Bio pastoral breve (2 frases)." },
    "footer": { "tagline": "Frase de encerramento (10 palavras)", "showSocial": true }
  }
}
Importante: O campo studyContent.content deve ter conteúdo real, rico e bíblico.`;

    try {
        const raw = await callAI(prompt, systemInstruction, "json");
        // Strip any potential markdown wrappers or artifacts
        let cleaned = raw;
        if (cleaned.includes('```')) {
            cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        // If there's garbage before or after the JSON, try to extract the main object
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        
        return JSON.parse(cleaned);
    } catch (e: any) {
        throw new Error(`Falha ao gerar one-page com IA: ${e.message}`);
    }
};
