import { GoogleGenAI } from "@google/genai";
// Env via flag

const geminiKey = process.env.NEXT_PUBLIC_API_KEY;

async function list() {
    console.log('Listing models...');
    const genAI = new GoogleGenAI({ apiKey: geminiKey });
    try {
        const response = await genAI.models.list();
        for (const model of response) {
            if (model.supportedActions.includes('embedContent')) {
                console.log(`- ${model.name}`);
            }
        }
    } catch (e) {
        console.error('Error listing models:', e.message);
    }
}

list();
