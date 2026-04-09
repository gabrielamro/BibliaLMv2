import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

/**
 * Retorna a instância única do GoogleGenAI
 */
export function getAiInstance(): GoogleGenAI {
    if (!aiInstance) {
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || (process.env as any).GEMINI_API_KEY || '';
        if (!apiKey) {
            console.warn("⚠️ Google AI API Key ausente.");
        }
        aiInstance = new GoogleGenAI({ apiKey });
    }
    return aiInstance;
}
