
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

async function testModel(modelName) {
    try {
        console.log(`Testing model: ${modelName}...`);
        const model = await genAI.models.get({ model: modelName });
        console.log(`Model ${modelName} found!`);
    } catch (error) {
        console.log(`Model ${modelName} NOT FOUND or ERROR: ${error.message}`);
    }
}

async function runTests() {
    await testModel("gemini-1.5-flash");
    await testModel("gemini-2.0-flash");
    await testModel("gemini-2.0-flash-lite");
}

runTests();
