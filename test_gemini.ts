// Test script for geminiService
import { sendMessageToGeminiStream } from './services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const history = [
    { role: 'model', content: 'Graça e paz!' },
    { role: 'user', content: 'Explique João 3:16' }
];

async function run() {
    try {
        console.log("Starting stream...");
        await sendMessageToGeminiStream(history, (chunk) => {
            process.stdout.write(chunk);
        });
        console.log("\nDone.");
    } catch (e) {
        console.error("Caught in test:", e);
    }
}

run();
