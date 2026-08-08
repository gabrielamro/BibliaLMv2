import { supabase } from './supabase';

// Mapeamento de estilos para queries de imagem em inglês
const STYLE_TO_QUERY: Record<string, string> = {
    'realistic': 'nature spiritual light',
    'oil_painting': 'nature landscape painting',
    'cinematic': 'cinematic nature light',
    'watercolor': 'watercolor nature painting',
    'realista': 'nature spiritual light',
    'óleo': 'oil painting nature',
    'cine': 'cinematic light landscape',
    'aquarela': 'watercolor painting nature',
};

const RELIGIOUS_KEYWORDS: Record<string, string> = {
    'cruz': 'cross light nature spiritual',
    'anjo': 'angel spiritual ethereal light',
    'oração': 'prayer hands light spiritual',
    'deserto': 'desert golden hour spiritual',
    'jardim': 'garden flowers nature peaceful',
    'bíblia': 'bible book old light',
    'céu': 'heavenly sky clouds golden light',
    'estrela': 'starry night sky spiritual',
    'mar': 'calm sea sunset spiritual',
    'leão': 'lion majestic nature',
    'cordeiro': 'lamb nature peaceful',
    'fogo': 'fire light spiritual dramatic',
    'espírito': 'dove bird white light',
    'pomba': 'dove bird white light',
    'israel': 'jerusalem old city landscape',
    'trigo': 'wheat field golden hour',
    'caminho': 'path forest sunlight spiritual',
    'promessa': 'rainbow sky clouds nature',
    'arco-íris': 'rainbow sky clouds nature',
    'tempestade': 'storm clouds dramatic sky sea',
    'calmaria': 'peaceful lake sunrise nature',
    'pastagens': 'green pastures hills nature',
    'reino': 'majestic castle mountain landscape',
    'coroa': 'crown light spiritual',
    'sangue': 'red sunrise dramatic sky',
    'colheita': 'harvest wheat field nature',
    'semeador': 'seeds ground nature sunlight',
};

const getUnsplashFallbackUrl = (text: string, style: string): { url: string; category: string } => {
    const lowerText = text.toLowerCase();
    let query = 'nature spiritual light';
    let category = 'Geral';
    
    // Lista de variações para cada estilo para evitar repetição
    const styleModifiers: Record<string, string[]> = {
        'realistic': ['4k', 'photography', 'ultra hd', 'vibrant'],
        'oil_painting': ['artwork', 'textured', 'fine art', 'canvas'],
        'cinematic': ['moody', 'epic', 'anamorphic', 'dark light'],
        'watercolor': ['soft', 'pastel', 'illustration', 'expressive'],
        'vintage': ['analog', 'film noir', 'faded', 'retro'],
        'minimalist': ['clean', 'simple', 'monochrome', 'space']
    };

    // Categorização por keywords bíblicas
    for (const [keyword, q] of Object.entries(RELIGIOUS_KEYWORDS)) {
        if (lowerText.includes(keyword)) { 
            query = q; 
            category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break; 
        }
    }
    
    // Se não achou keyword, usa o estilo mapeado
    if (query === 'nature spiritual light') {
        const styleInfo = STYLE_TO_QUERY[style.toLowerCase()] || 'nature spiritual landscape';
        query = styleInfo;
        category = 'Estúdio';
    }

    // Adiciona modifier aleatório baseado no estilo para diversificar
    const mods = styleModifiers[style.toLowerCase()] || [];
    if (mods.length > 0) {
        query += ` ${mods[Math.floor(Math.random() * mods.length)]}`;
    }
    
    const sig = Math.floor(Math.random() * 20000);
    const url = `https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80&query=${encodeURIComponent(query)}&sig=${sig}`;
    return { url, category };
};

const unsplashUrlToBase64 = async (url: string): Promise<{ mimeType: string; data: string } | null> => {
    try {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({ mimeType: blob.type || 'image/jpeg', data: base64 });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch { return null; }
};

export const generateVerseImage = async (text: string, reference: string, style: string): Promise<{ mimeType: string; data: string; category: string } | null> => {
    const lowerText = text.toLowerCase();
    let category = 'Geral';
    for (const keyword of Object.keys(RELIGIOUS_KEYWORDS)) {
        if (lowerText.includes(keyword)) {
            category = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break;
        }
    }

    // 1. Workers AI through the protected server route (Gemini remains server fallback).
    try {
        if (typeof window === 'undefined') {
            const { generateAiImageOnServer } = await import('./serverImageGenerationService');
            const image = await generateAiImageOnServer(`High quality ${style} Christian sacred art inspired by "${text}" (${reference}). No text, letters, words, frames, logos or watermarks. Avoid red backgrounds.`);
            return { mimeType: image.mimeType, data: image.data, category };
        }

        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('Entre na sua conta para gerar imagens.');
        const response = await fetch('/api/ai/image', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, reference, style }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || 'Image generation request failed.');
        if (!payload?.data) throw new Error('No image data returned from provider.');
        return { mimeType: payload.mimeType || 'image/jpeg', data: payload.data, category };
    } catch (e: any) {
        console.warn('Workers AI image generation failed, trying stock image fallback:', e.message || e);
    }

    // 2. Try Pexels (if API key available)
    try {
        const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
        if (pexelsKey) {
            const lowerText = text.toLowerCase();
            let query = 'nature spiritual';
            for (const [keyword, q] of Object.entries(RELIGIOUS_KEYWORDS)) {
                if (lowerText.includes(keyword)) { query = q; break; }
            }
            const response = await fetch(
                `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
                { headers: { Authorization: pexelsKey } }
            );
            const data = await response.json();
            const photos = data.photos;
            if (photos && photos.length > 0) {
                const photo = photos[Math.floor(Math.random() * Math.min(photos.length, 10))];
                const imgUrl = photo.src.large2x || photo.src.large;
                const result = await unsplashUrlToBase64(imgUrl);
                if (result) return { ...result, category: category || 'Geral' };
            }
        }
    } catch (e) {
        console.warn('Pexels fallback failed, trying Unsplash...', e);
    }

    // 3. Unsplash Source (no API key required — free tier)
    try {
        const fallback = getUnsplashFallbackUrl(text, style);
        const result = await unsplashUrlToBase64(fallback.url);
        if (result) return { ...result, category: fallback.category };
    } catch (e) {
        console.warn('Unsplash fallback also failed:', e);
    }

    return null;
};

export const generatePodcastCover = async (title: string) => {
    return generateVerseImage(title, "Podcast Cover", "minimalist");
};
