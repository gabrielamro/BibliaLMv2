
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const test = async () => {
    const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });
    const model = "gemini-3-flash-preview";

    try {
        console.log("Testing with string contents...");
        const res1 = await genAI.models.generateContent({
            model,
            contents: "Say hello"
        });
        console.log("Res1 text:", res1.text);

        console.log("\nTesting with array contents...");
        const res2 = await genAI.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: "Say hello" }] }]
        });
        console.log("Res2 text:", res2.text);
    } catch (e) {
        console.error("Error:", e);
    }
};

test();
