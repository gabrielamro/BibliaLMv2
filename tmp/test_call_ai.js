
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function testCallAi() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const genAI = new GoogleGenAI({ apiKey });
    const TEXT_MODEL = "gemini-2.5-flash";
    
    const prompt = "Olá, tudo bem?";
    const systemInstruction = "Atue como um Pastor Auditor.";
    const responseFormat = "text";

    try {
        console.log("Testing Gemini call within callAi logic...");
        const response = await genAI.models.generateContent({
            model: TEXT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { 
                systemInstruction,
                responseMimeType: responseFormat === 'json' ? "application/json" : "text/plain"
            }
        });
        console.log("Response:", response.text);
    } catch (e) {
        console.error("Gemini Error:", e.message);
        console.error("Full Error:", JSON.stringify(e, null, 2));
    }
}

testCallAi();
