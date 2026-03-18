
import * as bigPickle from './bigPickleService';
import * as gemini from './geminiService';
import { auditarConteudo, AuditoriaResult } from './pastorAuditor';

export type AIProvider = 'bigpickle' | 'gemini' | 'auto';

export interface PastorConfig {
    provider: AIProvider;
    context?: string;
    audit?: boolean;
}

export interface PastorResponse<T> {
    data: T;
    audit?: AuditoriaResult;
}

const PASTOR_SYSTEM_INSTRUCTION = `Você é o Pastor Auditor (Obreiro IA) do BibliaLM.
DIRETRIZES FUNDAMENTAIS:
1. TOM: Pastoral, acolhedor, sábio e humilde.
2. FUNDAMENTAÇÃO: Baseie-se estritamente na verdade bíblica e cite referências (Capítulo e Versículo).
3. TRANSPARÊNCIA: Diferencie claramente fatos bíblicos de incentivos ou interpretações pastorais.
4. VERACIDADE: Evite alucinações teológicas. Se algo não estiver na Bíblia, sinalize como interpretação ou admita não saber.

O usuário está em um contexto de estudo: `;

export const checkHealth = async (provider: AIProvider = 'auto'): Promise<boolean> => {
    if (provider === 'bigpickle' || provider === 'auto') {
        const bpHealth = await bigPickle.checkBigPickleHealth();
        if (bpHealth) return true;
    }
    if (provider === 'gemini' || provider === 'auto') {
        return await gemini.checkAiHealth();
    }
    return false;
};

export const analyzeUnderstanding = async (userThoughts: string, context: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.analyzeUnderstanding(userThoughts, context);
    }
    return await bigPickle.analyzeUnderstanding(userThoughts, context);
};

export const generateDailyDevotional = async (forceNew: boolean = false, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateDailyDevotional(forceNew);
    }
    return await bigPickle.generateDailyDevotional(forceNew);
};

export const improveNote = async (content: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.improveNote(content);
    }
    return await bigPickle.improveNote(content);
};

export const summarizeNoteForSocial = async (content: string, bookName: string, chapter: number, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.summarizeNoteForSocial(content, bookName, chapter);
    }
    return await bigPickle.summarizeNoteForSocial(content, bookName, chapter);
};

export const generateSermonOutline = async (contextText: string, theme: string, audience: string, title?: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateSermonOutline(contextText, theme, audience, title);
    }
    return await bigPickle.generateSermonOutline(contextText, theme, audience, title);
};

export const generateSermonIllustration = async (theme: string, context: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateSermonIllustration(theme, context);
    }
    return await bigPickle.generateSermonIllustration(theme, context);
};

export const generateSmallGroupQuestions = async (sermonContent: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateSmallGroupQuestions(sermonContent);
    }
    return await bigPickle.generateSmallGroupQuestions(sermonContent);
};

export const generateStructuredStudy = async (theme: string, reference: string, audience: string, mode: 'quick' | 'deep', provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateStructuredStudy(theme, reference, audience, mode);
    }
    return await bigPickle.generateStructuredStudy(theme, reference, audience, mode);
};

export const generateModuleDayContent = async (theme: string, dayTitle: string, verses: string[], provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateModuleDayContent(theme, dayTitle, verses);
    }
    return await bigPickle.generateModuleDayContent(theme, dayTitle, verses);
};

export const generateBibleQuiz = async (topic: string, difficulty: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateBibleQuiz(topic, difficulty);
    }
    return await bigPickle.generateBibleQuiz(topic, difficulty);
};

export const analyzeReadingPlanCommitment = async (days: number, scope: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.analyzeReadingPlanCommitment(days, scope);
    }
    return await bigPickle.analyzeReadingPlanCommitment(days, scope);
};

export const suggestReadingPlan = async (userPrompt: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.suggestReadingPlan(userPrompt);
    }
    return await bigPickle.suggestReadingPlan(userPrompt);
};

export const generateReadingConnection = async (refs: string[], provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateReadingConnection(refs);
    }
    return await bigPickle.generateReadingConnection(refs);
};

export const generateSuggestedPrayer = async (requestContent: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateSuggestedPrayer(requestContent);
    }
    return await bigPickle.generateSuggestedPrayer(requestContent);
};

export const getBibleChapter = async (bookName: string, chapter: number, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.getBibleChapter(bookName, chapter);
    }
    return await bigPickle.getBibleChapter(bookName, chapter);
};

export const generateSpecificPrayer = async (topic: string, feeling: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateSpecificPrayer(topic, feeling);
    }
    return await bigPickle.generateSpecificPrayer(topic, feeling);
};

export const generateImagePromptForPlan = async (title: string, description: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateImagePromptForPlan(title, description);
    }
    return await bigPickle.generateImagePromptForPlan(title, description);
};

export const generateSocialPostDesign = async (text: string, ref: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generateSocialPostDesign(text, ref);
    }
    return await bigPickle.generateSocialPostDesign(text, ref);
};

export const generatePodcastScript = async (sourceText: string, title: string, provider: AIProvider = 'bigpickle') => {
    if (provider === 'gemini') {
        return await gemini.generatePodcastScript(sourceText, title);
    }
    return await bigPickle.generatePodcastScript(sourceText, title);
};

export const chatWithPastor = async (
    history: any[],
    onChunk: (text: string) => void,
    context?: string
) => {
    return await gemini.sendMessageToGeminiStream(history, onChunk, context);
};

export const sendMessageToGeminiStream = async (
    history: any[],
    onChunk: (text: string) => void,
    context?: string
) => {
    return await gemini.sendMessageToGeminiStream(history, onChunk, context);
};

export const generateVerseImage = async (text: string, reference: string, style: string) => {
    return await gemini.generateVerseImage(text, reference, style);
};

export const generatePodcastAudio = async (script: string) => {
    return await gemini.generatePodcastAudio(script);
};

export const generatePodcastCover = async (title: string) => {
    return await gemini.generatePodcastCover(title);
};

export const generateChapterAudioStream = async function*(text: string) {
    yield* gemini.generateChapterAudioStream(text);
};

export const findNearbyChurches = async (lat: number, lng: number) => {
    return await gemini.findNearbyChurches(lat, lng);
};

export type { NearbyPlace } from './geminiService';

export const generateDevotionalWithAudit = async (forceNew: boolean = false, audit: boolean = true) => {
    const content = await generateDailyDevotional(forceNew, 'bigpickle');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(
        JSON.stringify(content), 
        'devotional'
    );
    return { data: content, audit: auditResult };
};

export const generateStudyWithAudit = async (
    theme: string, 
    reference: string, 
    audience: string, 
    mode: 'quick' | 'deep',
    audit: boolean = true
) => {
    const content = await generateStructuredStudy(theme, reference, audience, mode, 'bigpickle');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(content, 'study');
    return { data: content, audit: auditResult };
};

export const generatePrayerWithAudit = async (
    topic: string, 
    feeling: string,
    audit: boolean = true
) => {
    const content = await generateSpecificPrayer(topic, feeling, 'bigpickle');
    if (!audit || !content) return { data: content };
    
    const auditResult = await auditarConteudo(
        JSON.stringify(content), 
        'prayer'
    );
    return { data: content, audit: auditResult };
};

export const generateSermonWithAudit = async (
    contextText: string,
    theme: string,
    audience: string,
    audit: boolean = true
) => {
    const content = await generateSermonOutline(contextText, theme, audience, undefined, 'bigpickle');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(content, 'study');
    return { data: content, audit: auditResult };
};

export const generateQuizWithAudit = async (
    topic: string,
    difficulty: string,
    audit: boolean = true
) => {
    const content = await generateBibleQuiz(topic, difficulty, 'bigpickle');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(
        JSON.stringify(content), 
        'study'
    );
    return { data: content, audit: auditResult };
};

export { type AuditoriaResult } from './pastorAuditor';
