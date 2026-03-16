import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const aiInstance = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}...`);
    try {
        const response = await aiInstance.models.generateContent({
            model: modelName,
            contents: "Say 'Hello' back to me! Just that word.",
        });
        console.log(`✓ ${modelName} Works! Response: ${response.text}`);
        return true;
    } catch(e) {
        console.error(`✗ ${modelName} Failed: ${e.message}`);
        return false;
    }
}

async function run() {
    await testModel("gemini-2.5-flash");
    await testModel("gemini-2.0-flash");
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-flash-latest");
}

run();
