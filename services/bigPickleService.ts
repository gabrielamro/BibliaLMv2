
import { DAILY_BREAD } from "../constants";

const BIGPICKLE_API_KEY = process.env.NEXT_PUBLIC_BIGPICKLE_API_KEY;
const BIGPICKLE_MODEL = "big-pickle";
const BASE_URL = "https://opencode.ai/zen/v1";

const callBigPickle = async (
    prompt: string,
    systemInstruction?: string,
    responseFormat?: "json" | "text"
): Promise<string> => {
    if (!BIGPICKLE_API_KEY) {
        throw new Error("BigPickle API Key não configurada");
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${BIGPICKLE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: BIGPICKLE_MODEL,
            messages: [
                { 
                    role: "system", 
                    content: systemInstruction || "Atue como um conselheiro teológico sábio e pastoral. Baseie-se na Bíblia, cite referências (capítulo e versículo), seja acolhedor e diferencie fatos bíblicos de interpretações."
                },
                { role: "user", content: prompt }
            ],
            ...(responseFormat === 'json' && { 
                response_format: { type: "json_object" } 
            })
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Erro na API BigPickle");
    }
    
    return data.choices?.[0]?.message?.content || "";
};

export const checkBigPickleHealth = async (): Promise<boolean> => {
    try {
        const response = await callBigPickle("Responda apenas 'OK'");
        return response.toLowerCase().includes('ok');
    } catch (e) {
        console.error("BigPickle Health Check failed:", e);
        return false;
    }
};

export const analyzeUnderstanding = async (userThoughts: string, context: string): Promise<string> => {
    try {
        const prompt = `Analise esta reflexão do usuário sobre o texto: "${userThoughts}". Contexto bíblico: "${context}". Forneça feedback teológico, encorajamento e uma aplicação prática. Responda em HTML simples (p, strong, ul, li).`;
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) {
        return "Erro na análise.";
    }
};

export const generateDailyDevotional = async (forceNew: boolean = false) => {
    try {
        const prompt = `Gere um devocional cristão profundo e acolhedor para hoje. 
        REGRAS PASTORAIS:
        1. Baseie-se estritamente na verdade bíblica.
        2. Diferencie claramente fatos bíblicos de incentivo pastoral.
        3. Se houver interpretação, sinalize com humildade.
        4. Cite explicitamente a fonte (capítulo e versículo).
        
        Inclua: Título, Referência Bíblica (Ex: Salmos 23:1), Texto do Versículo, Conteúdo (Reflexão profunda de 3 parágrafos) e uma Oração final. 
        Retorne em JSON: { title, verseReference, verseText, content, prayer }.`;
        const text = await callBigPickle(prompt, undefined, "json");
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
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return content; }
};

export const summarizeNoteForSocial = async (content: string, bookName: string, chapter: number) => {
    try {
        const prompt = `Crie um resumo curto e inspirador (max 280 chars) para compartilhar no feed social, baseado nesta nota sobre ${bookName} ${chapter}: "${content}". Inclua hashtags.`;
        const text = await callBigPickle(prompt, undefined, "text");
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
        
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateSermonIllustration = async (theme: string, context: string): Promise<string> => {
    try {
        const prompt = `Crie uma ilustração (história, metáfora ou exemplo histórico) curta e impactante para um sermão sobre: "${theme}". Contexto bíblico: "${context}". A ilustração deve ajudar a explicar o ponto teológico de forma emocional e memorável. Formato HTML (p).`;
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateSmallGroupQuestions = async (sermonContent: string): Promise<string> => {
    try {
        const prompt = `Com base neste esboço de sermão, crie 5 perguntas para discussão em pequenos grupos (Células/PGs). As perguntas devem estimular a aplicação prática e a comunhão. 

Sermão: "${sermonContent.substring(0, 1000)}..." 

Formato HTML (ul, li, strong).`;
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateStructuredStudy = async (theme: string, reference: string, audience: string, mode: 'quick' | 'deep'): Promise<string> => {
    const prompt = `
    Atue como um Pastor Auditor sábio e humilde. Crie um estudo bíblico direto, acolhedor e profundamente fundamentado.
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
        const text = await callBigPickle(prompt, undefined, "text");
        let html = text || "";
        html = html.replace(/```html/g, '').replace(/```/g, '').trim();
        return html;
    } catch (e) {
        console.error("BigPickle Generation Error: ", e);
        return "";
    }
};

export const generateModuleDayContent = async (theme: string, dayTitle: string, verses: string[]) => {
    try {
        const prompt = `Escreva o conteúdo completo de um estudo bíblico sobre "${dayTitle}" dentro do tema "${theme}". Versículos base: ${verses.join(', ')}. Use formato HTML rico com design elegante e contraste garantido.`;
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return ""; }
};

export const generateBibleQuiz = async (topic: string, difficulty: string) => {
    try {
        const prompt = `Generate 5 bible quiz questions about "${topic}" with difficulty "${difficulty}". 
            REGRAS: As perguntas devem ser baseadas em fatos bíblicos claros, cite a referência na explicação.
            JSON format: [{ id: number, question: string, options: string[], correctIndex: number, explanation: string, reference: string }]`;
        const text = await callBigPickle(prompt, undefined, "json");
        return JSON.parse(text || "[]");
    } catch (e) { return []; }
};

export const analyzeReadingPlanCommitment = async (days: number, scope: string) => {
    try {
        const prompt = `Analise um plano de leitura da Bíblia (${scope}) em ${days} dias. Calcule capítulos/dia, versículos estimados, dificuldade e crie uma frase de compromisso e 3 dicas. JSON: { commitment, tips, difficulty, versesPerDay, strategy }`;
        const result = await callBigPickle(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const suggestReadingPlan = async (userPrompt: string) => {
    try {
        const prompt = `Sugira uma configuração de plano de leitura baseada no pedido: "${userPrompt}". Retorne JSON: { scope: 'all' | 'new_testament' | 'old_testament', days: number }`;
        const result = await callBigPickle(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateReadingConnection = async (refs: string[]) => {
    try {
        const prompt = `Encontre a conexão teológica entre estas leituras: ${refs.join(', ')}. Retorne JSON: { theme: string, conclusion: string }`;
        const result = await callBigPickle(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

export const generateSuggestedPrayer = async (requestContent: string): Promise<string> => {
    try {
        const prompt = `Atue como um Pastor Auditor intercessor. Escreva uma oração curta (max 3 frases) e profunda intercedendo por: "${requestContent}". Se possível, inclua uma breve menção a uma promessa bíblica.`;
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return "Senhor, ouve este clamor e traz consolo segundo a Tua Palavra. Amém."; }
};

export const getBibleChapter = async (bookName: string, chapter: number) => {
    try {
        const prompt = `Forneça o texto fiel e completo de ${bookName} capítulo ${chapter} na versão Almeida Revista e Corrigida (ARC). 
            REGRA DE INTEGRIDADE: Retorne exatamente os versículos bíblicos sem alterações, resumos ou comentários. 
            Retorne JSON: { number: number, verses: [{ number: number, text: string }] }`;
        const text = await callBigPickle(prompt, undefined, "json");
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
        
        const text = await callBigPickle(prompt, undefined, "json");
        return JSON.parse(text || "{}");
    } catch (e) { 
        console.error("Erro ao gerar oração específica:", e);
        return null; 
    }
};

export const generateImagePromptForPlan = async (title: string, description: string) => {
    try {
        const prompt = `Create a vivid, artistic image prompt for a bible study plan titled "${title}": ${description}. The prompt should be suitable for an image generation model.`;
        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return null; }
};

export const generateSocialPostDesign = async (text: string, ref: string) => {
    try {
        const prompt = `Suggest a design for a social media post for verse "${ref}". JSON: { gradient: string (css), textColor: string, fontStyle: string, caption: string, hashtags: string[] }`;
        const result = await callBigPickle(prompt, undefined, "json");
        return JSON.parse(result || "{}");
    } catch (e) { return null; }
};

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

        return await callBigPickle(prompt, undefined, "text");
    } catch (e) { return null; }
};
