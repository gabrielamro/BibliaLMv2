
const { GoogleGenAI } = require("@google/genai");

const apiKey = "AIzaSyDKz7nuu1YtLLB7QSXRYM4CwZNLfCPLd4g";

const genAI = new GoogleGenAI({ apiKey });
const TEST_MODELS = ["gemini-3-flash-preview", "gemini-1.5-flash", "gemini-2.0-flash-exp"];

async function test() {
    for (const modelName of TEST_MODELS) {
        try {
            console.log("\n--- Testing model:", modelName, "---");
            const response = await genAI.models.generateContent({
                model: modelName,
                contents: [{ role: 'user', parts: [{ text: "Diga 'Olá' em 1 palavra" }] }]
            });
            console.log("Success! Response:", response.text);
        } catch (e) {
            console.error("Failed model", modelName, ":", e.message);
        }
    }
}

test();
