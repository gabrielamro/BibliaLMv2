import { GoogleGenAI, Modality } from "@google/genai";
import { DAILY_BREAD } from "../constants";
import { getAiInstance } from "./aiConfig";
import { generateVerseImage } from "./imageGenService";

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

const TEXT_MODEL = "models/gemini-2.5-flash";
const TTS_MODEL = "models/gemini-3.1-flash-tts-preview";
const TTS_FALLBACK_MODEL = "models/gemini-2.5-flash-preview-tts";
const TTS_RETRY_DELAYS_MS = [800, 1800];

const createTtsConfig = () => ({
    responseModalities: [Modality.AUDIO],
    speechConfig: {
        voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Iapetus" }
        }
    }
});

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const isTemporaryTtsError = (error: unknown) => {
    const value = error as { code?: number; status?: number | string; message?: string };
    const details = `${value?.code ?? ""} ${value?.status ?? ""} ${value?.message ?? ""}`;
    return /\b(429|500|502|503|504)\b|UNAVAILABLE|high demand/i.test(details);
};

const getInlineAudio = (response: Awaited<ReturnType<ReturnType<typeof getAiInstance>["models"]["generateContent"]>>) => (
    response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData?.data ?? null
);

const GROQ_MODEL = "llama-3.3-70b-versatile";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const extractJsonObject = (value: string) => {
    let cleaned = value.trim();
    if (cleaned.includes('```')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
};

const parseJsonWithRepair = async (raw: string, repairContext: string) => {
    const cleaned = extractJsonObject(raw);
    try {
        return JSON.parse(cleaned);
    } catch (initialError: any) {
        const repaired = await callAi(
            `Corrija APENAS a sintaxe JSON abaixo. Não reescreva o conteúdo, não resuma e não adicione markdown. Retorne somente JSON válido.\n\nCONTEXTO: ${repairContext}\n\nJSON COM ERRO:\n${cleaned}`,
            'Voce e um reparador de JSON. Preserve todos os campos e textos, corrigindo apenas aspas, virgulas, barras invertidas e quebras de linha invalidas.',
            'json'
        );
        try {
            return JSON.parse(extractJsonObject(repaired));
        } catch {
            throw initialError;
        }
    }
};

// Generic AI Call with Fallbacks (Order: Groq → OpenRouter → Gemini)
export const callAi = async (prompt: string, systemInstruction?: string, responseFormat?: "json" | "text"): Promise<string> => {
    // 1. Try Groq (primary — free tier, high quota)
    try {
        const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
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
        const orKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        if (orKey) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${orKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://biblialm.com",
                    "X-Title": "BíbliaLM"
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
                systemInstruction: systemInstruction || undefined,
                responseMimeType: responseFormat === 'json' ? "application/json" : undefined
            }
        });
        if (response.text) return response.text;
    } catch (e: any) {
        console.warn("Gemini unavailable in callAi:", e.message || e);
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

        Inclua: Título, Referência Bíblica (Ex: Salmos 23:1), Texto do Versículo, Conteúdo e uma Oração final.

        ESTRUTURA OBRIGATÓRIA DO CONTEÚDO (3 parágrafos em texto simples):
        - Parágrafo 1 — Contexto imediato: situe o versículo dentro do capítulo ou episódio bíblico, mencionando referências de apoio quando forem seguras.
        - Parágrafo 2 — Sentido central: explique palavras, imagens, contrastes ou promessas presentes no próprio texto, sem inventar dados históricos.
        - Parágrafo 3 — Aplicação pastoral: conecte a verdade bíblica à vida cotidiana com prudência, sem prometer ausência de sofrimento, cura ou prosperidade.
        Não use HTML. Não trate aplicação pastoral como se fosse citação bíblica. Se um detalhe contextual for incerto, omita-o.
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

export const generateChurchServicePlanning = async (
    verseReference: string,
    verseText: string,
    userPrompt: string,
    serviceStartTime = '19:00',
    serviceEndTime = '21:00'
) => {
    try {
        const prompt = `Crie uma sugestão de planejamento para um culto cristão usando o versículo base e o pedido pastoral.

        Versículo base: ${verseReference}
        Texto do versículo: ${verseText}
        Inicio do culto: ${serviceStartTime}
        Fim previsto do culto: ${serviceEndTime}
        Pedido do pastor/gestor: ${userPrompt || 'Monte um culto equilibrado para a igreja local.'}

        REGRAS:
        - Use tom pastoral, prudente e bíblico.
        - Não invente doutrinas ou promessas absolutas.
        - Diferencie o que vem do texto bíblico da aplicação pastoral sem usar linguagem técnica para membros.
        - Gere uma timeline objetiva, pronta para revisão humana.
        - IMPORTANTE: todo campo "notes" deve ser texto final para aparecer diretamente na OnePage aos membros.
        - Não escreva instrucoes internas como "o pastor deve", "sugira", "orientar", "conduzir", "falar sobre" ou "momento para".
        - Escreva como mensagem pronta do culto, em tom acolhedor, curto e públicavel.
        - Horários devem estar no formato HH:mm.
        - A timeline deve começar em ${serviceStartTime} e todos os momentos devem ficar dentro da janela ate ${serviceEndTime}.
        - Não use horários antes do início nem depois do fim previsto do culto.
        - Use categorias litúrgicas validas: entrance, opening, worship, word, offering, prayer, response, closing, other.
        - Para worship, preencha "songs" com exatamente 3 titulos de louvores congregacionais sugeridos, alinhados ao tema e ao versículo.
        - Para worship, preencha "songTexts" como objeto onde cada titulo em "songs" tenha seu proprio texto separado.
        - Em "songTexts", escreva a letra COMPLETA de cada música (tanto músicas conhecidas/comerciais quanto autorais) para que os membros possam cantar no culto. Nunca use placeholders, resumos ou a mensagem "Cole aqui a letra licenciada/autorizada pela igreja.".
        - Para word, preencha "verseRef", "verseText" e "notes" com um roteiro pronto de condução da leitura bíblica e introdução da Palavra.
        - O "notes" do word deve ter 2 a 4 frases: convite para a igreja acompanhar a leitura, uma frase ligando o texto ao tema, e uma transição curta para a pregação/reflexão.
        - No "notes" do word, não copie simplesmente o versículo; use o texto bíblico como base para orientar a leitura e preparar a escuta.
        - Para offering, preencha "notes" com a mensagem final de dízimos/ofertas e deixe pixKeyType/pixKey vazios se não houver chave informada.
        - Para prayer, use "notes" como uma chamada final para oração congregacional.
        - Para closing, use "notes" como mensagem final de encerramento.

        Retorne somente JSON neste formato:
        {
          "title": "Nome curto do culto",
          "theme": "Tema da mensagem",
          "serviceType": "sunday",
          "pastoralFocus": "Resumo pastoral em uma frase",
          "liturgyItems": [
            { "kind": "entrance", "title": "Liturgia de Entrada", "startsAt": "18:45", "responsible": "", "notes": "..." },
            { "kind": "opening", "title": "Abertura", "startsAt": "19:00", "responsible": "", "notes": "..." },
            { "kind": "worship", "title": "Adoração e Louvor", "startsAt": "19:15", "responsible": "", "songs": ["Louvor sugerido 1", "Louvor sugerido 2", "Louvor sugerido 3"], "songTexts": { "Louvor sugerido 1": "Texto separado do louvor 1.", "Louvor sugerido 2": "Texto separado do louvor 2.", "Louvor sugerido 3": "Texto separado do louvor 3." }, "notes": "..." },
            { "kind": "word", "title": "Liturgia da Palavra", "startsAt": "19:50", "responsible": "", "verseRef": "${verseReference}", "verseText": "${verseText}", "notes": "Vamos acompanhar a leitura de ${verseReference}. Ao ouvir este texto, perceba como a Palavra nos conduz ao tema do culto. Depois da leitura, meditaremos juntos sobre o que Deus nos chama a crer e praticar." },
            { "kind": "offering", "title": "Dízimos e Ofertas", "startsAt": "20:35", "responsible": "", "notes": "...", "pixKeyType": "", "pixKey": "" },
            { "kind": "prayer", "title": "Momento de Oração", "startsAt": "20:45", "responsible": "", "notes": "..." },
            { "kind": "closing", "title": "Encerramento", "startsAt": "20:55", "responsible": "", "notes": "..." }
          ]
        }`;
        const text = await callAi(prompt, "Atue como um pastor auxiliar que ajuda a planejar cultos com prudencia bíblica.", "json");
        return JSON.parse(text || "{}");
    } catch (e) {
        return null;
    }
};

export const generateSongLyricsText = async (songTitle: string, context = ''): Promise<string> => {
    try {
        const prompt = `Retorne a letra COMPLETA da música "${songTitle}".

        Contexto do culto: ${context || 'culto cristão congregacional'}

        Regras importantes:
        - Forneça a letra INTEGRAL e COMPLETA da música para que a congregação possa cantar.
        - Não use resumos ou placeholders.
        - Não use a mensagem "Cole aqui a letra licenciada/autorizada pela igreja." sob nenhuma hipótese.
        - Retorne apenas a letra completa da música, formatada com quebras de linha corretas, sem explicações, tags ou comentários extras.`;
        return await callAi(prompt, "Atue como um assistente de louvor que fornece a letra completa das músicas solicitadas.", "text");
    } catch {
        return "";
    }
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
    Reférência base: "${reference}". (Se vaga, escolha uma referência canônica perfeita).
    Modo: "${mode === 'quick' ? 'Devocional Rápido' : 'Estudo Pastoral Direto'}".

    REGRAS PASTORAIS (Obrigatoriedade):
    1. FUNDAMENTAÇÃO: Todo ensino deve ser ancorado em Escrituras reais. Cite Capítulo e Versículo.
    2. TRANSPARÊNCIA: Diferencie fatos bíblicos/históricos (exegese) de incentivos ou interpretações pastorais.
    3. TOM: Sej? um "Obreiro" servidor. Use um tom natural, humano e empático.
    4. QUALIDADE: Não use placeholders. Se citar um fato histórico, certifique-se de que é verificável.

    ESTRUTURA HTML (Retorne APENAS HTML):
    <h1 class="bible-title">[Título Motivador]</h1>
    <p class="bible-subtitle">[Reférência Bíblica Fundamental]</p>
    
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
        const parsed = JSON.parse(result || "{}");

        let versesPerDay = 0;
        if (typeof parsed.versesPerDay === 'number') {
            versesPerDay = parsed.versesPerDay;
        } else if (typeof parsed.versesPerDay === 'object' && parsed.versesPerDay !== null) {
            versesPerDay = Number(parsed.versesPerDay.estimatedVersesPerDay || parsed.versesPerDay.versesPerDay || parsed.versesPerDay.verses || 0);
        } else if (typeof parsed.estimatedVersesPerDay === 'number') {
            versesPerDay = parsed.estimatedVersesPerDay;
        } else if (typeof parsed.versesPerDay === 'string') {
            versesPerDay = Number.parseInt(parsed.versesPerDay, 10) || 0;
        }

        const totalChapters = scope === 'all' ? 1189 : scope === 'new_testament' ? 260 : 929;
        const fallbackVerses = Math.ceil((totalChapters / Math.max(1, days)) * 26);

        return {
            commitment: typeof parsed.commitment === 'string' ? parsed.commitment : "Aceito o desafio de crescer no conhecimento da Graça e da Verdade.",
            tips: typeof parsed.tips === 'string' ? parsed.tips : "1. Defina um horário fixo.\n2. Ore antes de ler.\n3. Não desista se atrasar um dia.",
            difficulty: typeof parsed.difficulty === 'string' ? parsed.difficulty : "Moderado",
            versesPerDay: versesPerDay > 0 ? versesPerDay : fallbackVerses,
            strategy: typeof parsed.strategy === 'string' ? parsed.strategy : `Leitura sequencial de aprox. ${(totalChapters / Math.max(1, days)).toFixed(1)} capítulos por dia.`,
        };
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
        1. Sej? profundo, empático e bíblico.
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
// Image generation logic moved to imageGenService.ts


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
        - Maria: Tom acolhedor, sensível, sábio e pastoral. Ela abre e fécha o programa e traz a aplicação emocional/espiritual.
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
            config: createTtsConfig()
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
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= TTS_RETRY_DELAYS_MS.length; attempt += 1) {
        let emittedAudio = false;
        try {
            const stream = await getAiInstance().models.generateContentStream({
                model: TTS_MODEL,
                contents: [{ parts: [{ text }] }],
                config: createTtsConfig()
            });

            for await (const chunk of stream) {
                const base64 = chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (base64) {
                    emittedAudio = true;
                    yield base64;
                }
            }
            return;
        } catch (error) {
            lastError = error;
            if (emittedAudio || !isTemporaryTtsError(error)) throw error;
            const retryDelay = TTS_RETRY_DELAYS_MS[attempt];
            if (retryDelay) await wait(retryDelay);
        }
    }

    try {
        // O modelo 2.5 não transmite áudio, mas mantém a narração disponível durante picos do 3.1.
        const response = await getAiInstance().models.generateContent({
            model: TTS_FALLBACK_MODEL,
            contents: [{ parts: [{ text }] }],
            config: createTtsConfig()
        });
        const base64 = getInlineAudio(response);
        if (base64) {
            yield base64;
            return;
        }
    } catch (fallbackError) {
        lastError = fallbackError;
    }

    throw new Error("Narração temporariamente indisponível. Tente novamente em instantes.", { cause: lastError });
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
            chunks.forEach((chunk) => {
                if (chunk.web && chunk.web.title) {
                    places.push({ name: chunk.web.title, address: chunk.web.uri || "Endereço via Maps" });
                }
            });
        }
        return places;
    } catch (e) { return []; }
};

export const generateAIOnePage = async (userPrompt: string, authorName?: string): Promise<any> => {
    const systemInstruction = `Atue como Obreiro IA do Culto+, um copiloto de estudo bíblico pastoral.
Crie conteúdo bíblico de alta densidade intelectual, elegância literária e visualmente rico, seguindo uma estrutura de diagramação de revista digital (Landing Page Premium).

DIRETRIZES DE DIAGRAMAÇÃO (ROADMAP V2):
Você deve organizar o conteúdo em 6 sessões editoriais dinâmicas:
Sessão 1: Impacto & Gancho Visual (Hero Split 1/1)
Sessão 2: Contextualização (Biblical 2/3 + Study Outline 1/3)
Sessão 3: Mergulho Profundo (Rich Text 1/1 - Conteúdo denso 600+ palavras)
Sessão 4: Multimídia & Apoio (Slide 1/1 + Related Verses dinâmico)
Sessão 5: Conclusão & Autoria (Authority 1/1 + Footer 1/1)
Sessão 6: Desafio Final (Reflection Question 1/1)

DIRETRIZES TÉCNICAS:
1. Use dados estruturados no rich-text para o app aplicar o template visual "A Revelação Plena".
2. NotebookLM Depth: Realize uma síntese profunda ligando o versículo a conceitos históricos e aplicações reais.
3. Responda APENAS com JSON válido.
4. Respeite as larguras (layoutWidth) para cada bloco conforme o roadmap.
5. No bloco rich-text, não invente HTML visual próprio. Retorne visualTemplate="revelacao-plena" e templateData com os campos pedidos.
6. O app vai montar cores, caixas, bordas, blockquote, box de passo prático e oração final. Sua responsabilidade é escrever conteúdo pastoral profundo para cada campo.
7. O study-outline deve usar exatamente os marcos do template: O Despertar, As Raízes da Verdade, O Caminho Prático, Passo Prático, Oração de Encerramento.`;

    const prompt = `PEDIDO: "${userPrompt}"
AUTOR: "${authorName || 'Pr. Gabriel'}"

Gere uma one-page pastoral completa em JSON seguindo EXATAMENTE esta sequência de blocos.
O campo "blocks" deve ser um ARRAY com EXATAMENTE estes 9 blocos NESTA ORDEM e COM ESTES layoutWidth:

blocks[0]:  type="hero-split",          layoutWidth="1/1"
blocks[1]:  type="biblical",             layoutWidth="2/3"
blocks[2]:  type="study-outline",        layoutWidth="1/3"
blocks[3]:  type="rich-text",            layoutWidth="1/1" (conteúdo com multiplos <h2>)
blocks[4]:  type="slide",                layoutWidth="1/1"
blocks[5]:  type="related-verses",       layoutWidth="1/1" (Será ajustado dinamicamente)
blocks[6]:  type="authority",            layoutWidth="1/1"
blocks[7]:  type="footer",               layoutWidth="1/1"
blocks[8]:  type="reflection-question",  layoutWidth="1/1"

⚠️ REGRA ABSOLUTA: Copie os valores de layoutWidth LITERALMENTE.

IMAGENS (obrigatório para hero-split e slide):
REGRA DE LAYOUT: o bloco biblical deve ser "2/3" e o study-outline deve ser "1/3".

FORMATAÇÃO OBRIGATÓRIA DO rich-text:
- Use o template visual "revelacao-plena".
- Retorne visualTemplate: "revelacao-plena".
- Retorne templateData com estes campos: title, subtitle, awakeningTitle, awakeningText, quote, quoteReference, rootsTitle, rootsText, practicalTitle, practicalText, practicalStepTitle, practicalStepText, prayerTitle, prayerText.
- Não retorne content HTML para o rich-text neste modo. O app vai gerar o HTML final com a identidade visual do template.
- Escreva textos ricos, pastorais e específicos ao pedido. awakeningText, rootsText e practicalText devem ter densidade real, não placeholders.

- Imagem 1: https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2000
- Imagem 2: https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000

JSON EXATO (preencha "..." com conteúdo real):
{
  "meta": { "title": "...", "description": "..." },
  "slug": "...",
  "blocks": [
    { "type": "hero-split", "layoutWidth": "1/1", "data": { "title": "...", "imageUrl": "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2000" } },
    { "type": "biblical", "layoutWidth": "2/3", "data": { "verse": "...", "text": "...", "reference": "...", "style": "classic" } },
    { "type": "study-outline", "layoutWidth": "1/3", "data": { "title": "Roteiro do Estudo", "description": "Navegue pelas seções do estudo", "items": ["O Despertar", "As Raízes da Verdade", "O Caminho Prático", "Passo Prático", "Oração de Encerramento"] } },
    { "type": "rich-text", "layoutWidth": "1/1", "data": { "title": "...", "visualTemplate": "revelacao-plena", "templateData": { "title": "...", "subtitle": "Estudo Bíblico Pastoral", "awakeningTitle": "1. O Despertar", "awakeningText": "...", "quote": "...", "quoteReference": "...", "rootsTitle": "2. As Raízes da Verdade", "rootsText": "...", "practicalTitle": "3. O Caminho Prático", "practicalText": "...", "practicalStepTitle": "Passo Prático", "practicalStepText": "...", "prayerTitle": "Oração de Encerramento", "prayerText": "..." } } },
    { "type": "slide", "layoutWidth": "1/1", "data": { "slides": [{ "id": "slide-1", "title": "...", "description": "...", "backgroundImage": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000", "mediaUrl": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000" }] } },
    { "type": "related-verses", "layoutWidth": "1/1", "data": { "title": "Versículos Relacionados", "verses": [{ "reference": "...", "summary": "..." }] } },
    { "type": "authority", "layoutWidth": "1/1", "data": { "name": "${authorName || 'Pr. Gabriel'}", "bio": "...", "avatarUrl": "" } },
    { "type": "footer", "layoutWidth": "1/1", "data": { "tagline": "...", "showSocial": true } },
    { "type": "reflection-question", "layoutWidth": "1/1", "data": { "title": "Reflexão", "question": "..." } }
  ]
}
`;

    try {
        const raw = await callAi(prompt, systemInstruction, "json");
        return await parseJsonWithRepair(raw, 'one-page pastoral Culto+');
    } catch (e: any) {
        throw new Error(`Falha ao gerar one-page: ${e.message}`);
    }
};

