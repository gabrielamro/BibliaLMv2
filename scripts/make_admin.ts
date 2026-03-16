// make_admin.ts
// Script to set user 'gabrielamaro' as admin in Supabase

import { dbService } from '../services/supabase';

async function makeAdmin() {
    const username = 'gabrielamaro';
    const profile = await dbService.getUserByUsername(username);
    if (!profile) {
        console.error(`User with username '${username}' not found.`);
        return;
    }
    // Update subscription tier to admin
    await dbService.updateUserProfile(profile.uid, { subscriptionTier: 'admin' });
    console.log(`User '${username}' (uid=${profile.uid}) has been set to admin.`);
}

makeAdmin().catch((e) => {
    console.error('Error updating user:', e);
});
