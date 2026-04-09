import * as gemini from './geminiService';
import * as imageGen from './imageGenService';
import { auditarConteudo, AuditoriaResult } from './pastorAuditor';

export type AIProvider = 'gemini' | 'auto';

export interface PastorConfig {
    provider: AIProvider;
    context?: string;
    audit?: boolean;
}

export interface DailyDevotionalOptions {
    excludedVerseReferences?: string[];
}

export interface PastorResponse<T> {
    data: T;
    audit?: AuditoriaResult;
}

export const checkHealth = async (provider: AIProvider = 'auto'): Promise<boolean> => {
    return await gemini.checkAiHealth();
};

export const analyzeUnderstanding = async (userThoughts: string, context: string, provider: AIProvider = 'gemini') => {
    return await gemini.analyzeUnderstanding(userThoughts, context);
};

export const generateDailyDevotional = async (
    forceNew: boolean = false,
    provider: AIProvider = 'gemini',
    options?: DailyDevotionalOptions
) => {
    return await gemini.generateDailyDevotional(forceNew, options);
};

export const improveNote = async (content: string, provider: AIProvider = 'gemini') => {
    return await gemini.improveNote(content);
};

export const summarizeNoteForSocial = async (content: string, bookName: string, chapter: number, provider: AIProvider = 'gemini') => {
    return await gemini.summarizeNoteForSocial(content, bookName, chapter);
};

export const generateSermonOutline = async (contextText: string, theme: string, audience: string, title?: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateSermonOutline(contextText, theme, audience, title);
};

export const generateSermonIllustration = async (theme: string, context: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateSermonIllustration(theme, context);
};

export const generateSmallGroupQuestions = async (sermonContent: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateSmallGroupQuestions(sermonContent);
};

export const generateStructuredStudy = async (theme: string, reference: string, audience: string, mode: 'quick' | 'deep', provider: AIProvider = 'gemini') => {
    return await gemini.generateStructuredStudy(theme, reference, audience, mode);
};

export const generateModuleDayContent = async (theme: string, dayTitle: string, verses: string[], provider: AIProvider = 'gemini') => {
    return await gemini.generateModuleDayContent(theme, dayTitle, verses);
};

export const generateBibleQuiz = async (topic: string, difficulty: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateBibleQuiz(topic, difficulty);
};

export const analyzeReadingPlanCommitment = async (days: number, scope: string, provider: AIProvider = 'gemini') => {
    return await gemini.analyzeReadingPlanCommitment(days, scope);
};

export const suggestReadingPlan = async (userPrompt: string, provider: AIProvider = 'gemini') => {
    return await gemini.suggestReadingPlan(userPrompt);
};

export const generateReadingConnection = async (refs: string[], provider: AIProvider = 'gemini') => {
    return await gemini.generateReadingConnection(refs);
};

export const generateSuggestedPrayer = async (requestContent: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateSuggestedPrayer(requestContent);
};

export const getBibleChapter = async (bookName: string, chapter: number, version: string = 'ara', provider: AIProvider = 'gemini') => {
    return await gemini.getBibleChapter(bookName, chapter, version);
};

export const generateSpecificPrayer = async (topic: string, feeling: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateSpecificPrayer(topic, feeling);
};

export const generateImagePromptForPlan = async (title: string, description: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateImagePromptForPlan(title, description);
};

export const generateSocialPostDesign = async (text: string, ref: string, provider: AIProvider = 'gemini') => {
    return await gemini.generateSocialPostDesign(text, ref);
};

export const generatePodcastScript = async (sourceText: string, title: string, provider: AIProvider = 'gemini') => {
    return await gemini.generatePodcastScript(sourceText, title);
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
    return await imageGen.generateVerseImage(text, reference, style);
};

export const generatePodcastAudio = async (script: string) => {
    return await gemini.generatePodcastAudio(script);
};

export const generatePodcastCover = async (title: string) => {
    return await imageGen.generatePodcastCover(title);
};

export const generateChapterAudioStream = async function*(text: string) {
    yield* gemini.generateChapterAudioStream(text);
};

export const findNearbyChurches = async (lat: number, lng: number) => {
    return await gemini.findNearbyChurches(lat, lng);
};

export type { NearbyPlace } from './geminiService';

export const generateDevotionalWithAudit = async (forceNew: boolean = false, audit: boolean = true) => {
    const content = await generateDailyDevotional(forceNew, 'gemini');
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
    const content = await generateStructuredStudy(theme, reference, audience, mode, 'gemini');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(content, 'study');
    return { data: content, audit: auditResult };
};

export const generatePrayerWithAudit = async (
    topic: string, 
    feeling: string,
    audit: boolean = true
) => {
    const content = await generateSpecificPrayer(topic, feeling, 'gemini');
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
    const content = await generateSermonOutline(contextText, theme, audience, undefined, 'gemini');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(content, 'study');
    return { data: content, audit: auditResult };
};

export const generateQuizWithAudit = async (
    topic: string,
    difficulty: string,
    audit: boolean = true
) => {
    const content = await generateBibleQuiz(topic, difficulty, 'gemini');
    if (!audit) return { data: content };
    
    const auditResult = await auditarConteudo(
        JSON.stringify(content), 
        'study'
    );
    return { data: content, audit: auditResult };
};

export { type AuditoriaResult } from './pastorAuditor';

export const generateAIOnePage = async (userPrompt: string, authorName?: string): Promise<any> => {
    return await gemini.generateAIOnePage(userPrompt, authorName);
};
