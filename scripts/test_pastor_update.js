import { dbService } from '../services/supabase.js';
import 'dotenv/config';

async function testUpdate() {
    const testUid = 'gabrielamaro_id_placeholder'; // We need a real ID or at least see what we have
    console.log('Fetching profiles to find a test user...');

    const { data: profiles, error } = await dbService.supabase.from('profiles').select('id, username, subscription_tier').limit(5);

    if (error || !profiles || profiles.length === 0) {
        console.error('Could not find profiles:', error?.message);
        return;
    }

    const user = profiles[0];
    console.log(`Testing with user: ${user.username} (ID: ${user.id}, Current Tier: ${user.subscription_tier})`);

    console.log('Updating to pastor...');
    try {
        await dbService.updateUserProfile(user.id, { subscriptionTier: 'pastor' });
        console.log('Update call finished.');

        const updatedProfile = await dbService.getUserProfile(user.id);
        console.log('Fetched after update:', updatedProfile?.subscriptionTier);

        if (updatedProfile?.subscriptionTier === 'pastor') {
            console.log('✅ Update successful at service level.');
        } else {
            console.log('❌ Update failed to persist.');
        }
    } catch (e) {
        console.error('Error during update:', e);
    }
}

testUpdate();
