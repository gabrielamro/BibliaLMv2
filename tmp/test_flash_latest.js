
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function testFlashLatest() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const model = "gemini-flash-latest";
    const genAI = new GoogleGenAI({ apiKey });
    try {
        console.log(`Testing content generation with ${model}...`);
        const response = await genAI.models.generateContent({ 
            model,
            contents: [{ parts: [{ text: "Diga apenas 'Conexão OK com flash-latest'" }] }] 
        });
        console.log("Response:", response.text);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testFlashLatest();
