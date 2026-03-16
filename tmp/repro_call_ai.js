
const { callAi } = require("../services/geminiService"); // This might fail if it's TS
// Instead, let's just use the logic
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function reproduce() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const genAI = new GoogleGenAI({ apiKey });
    const TEXT_MODEL = "gemini-2.5-flash";
    const prompt = "Teste";
    const systemInstruction = "Atue como Pastor.";
    const responseFormat = "text";

    try {
        const response = await genAI.models.generateContent({
            model: TEXT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { 
                systemInstruction,
                responseMimeType: responseFormat === 'json' ? "application/json" : "text/plain"
            }
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.error("Gemini failed:", e.message);
    }
}

reproduce();
