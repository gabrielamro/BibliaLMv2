// scripts/check_profile.ts
import { dbService, supabase } from '../services/supabase';

async function checkProfile() {
    const username = 'gabrielamaro';
    console.log(`Checking profile for username: ${username}`);

    const profileByUsername = await dbService.getUserByUsername(username);
    if (!profileByUsername) {
        console.log("Profile not found by username.");
        return;
    }

    console.log("Profile found by username:", profileByUsername);
    const uid = profileByUsername.uid;
    console.log(`Now checking profile by UID: ${uid}`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

    if (error) {
        console.error("Error fetching profile by UID directly:", error);
    } else {
        console.log("Data fetched by UID directly:", data);
    }
}

checkProfile().catch(console.error);
