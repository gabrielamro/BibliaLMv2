import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy de imagens para evitar CORS ao buscar imagens do Unsplash/Pexels no cliente.
 * Usage: GET /api/image-proxy?url=<encoded_image_url>
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Whitelist de domínios permitidos
    const allowedDomains = [
        'source.unsplash.com',
        'images.unsplash.com',
        'images.pexels.com',
        'nanobananaapi.ai',
        'api.nanobananaapi.ai',
    ];

    let url: URL;
    try {
        url = new URL(imageUrl);
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!allowedDomains.some(d => url.hostname.endsWith(d))) {
        return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    try {
        const response = await fetch(imageUrl, {
            headers: { 'User-Agent': 'BibliaLM/2.0' },
            redirect: 'follow',
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // 24h cache
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (e) {
        console.error('Image proxy error:', e);
        return NextResponse.json({ error: 'Proxy fetch error' }, { status: 500 });
    }
}
