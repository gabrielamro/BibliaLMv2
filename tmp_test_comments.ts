
import { dbService } from './services/supabase';

async function test() {
    try {
        console.log("Testing getPlanComments...");
        // Use some dummy or known IDs if possible, or just see if it fails on schema
        const data = await dbService.getPlanComments('test-plan', 'test-day');
        console.log("Success! Data:", data);
    } catch (e: any) {
        console.error("Caught error:", e);
        if (e.message) console.error("Message:", e.message);
        if (e.code) console.error("Code:", e.code);
        if (e.details) console.error("Details:", e.details);
    }
}

test();
