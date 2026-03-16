import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testVector() {
    const dummyVector = new Array(768).fill(0.1);
    const { error } = await supabase.from('bible_verses').insert({
        book_id: 'gn',
        chapter: 1,
        verse: 9999,
        text: 'test',
        embedding: dummyVector
    });
    if (error) {
        console.error('Vector test failed:', error.message);
    } else {
        console.log('Vector test succeeded (768 works!)');
        // Clean up
        await supabase.from('bible_verses').delete().eq('verse', 9999);
    }
}
testVector();
