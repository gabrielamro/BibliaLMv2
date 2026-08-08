import { NextRequest, NextResponse } from 'next/server';

import {
  exceedsImageSizeLimit,
  isImageContentType,
  parseAllowedImageUrl,
  readImageResponse,
} from './imageProxyPolicy';

const MAX_REDIRECTS = 3;

const fetchAllowedImage = async (initialUrl: URL) => {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      headers: { 'User-Agent': 'CultoMais/2.0' },
      redirect: 'manual',
    });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get('location');
    const redirectedUrl = location ? parseAllowedImageUrl(location, currentUrl) : null;
    if (!redirectedUrl) throw new Error('unsafe_redirect');

    currentUrl = redirectedUrl;
  }

  throw new Error('too_many_redirects');
};

/**
 * Proxy de imagens para evitar CORS ao buscar imagens externas no cliente.
 * Usage: GET /api/image-proxy?url=<encoded_image_url>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const url = parseAllowedImageUrl(imageUrl);
  if (!url) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
  }

  try {
    const response = await fetchAllowedImage(url);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    if (!isImageContentType(contentType)) {
      return NextResponse.json({ error: 'Unsupported image response' }, { status: 415 });
    }
    if (exceedsImageSizeLimit(response.headers.get('content-length'))) {
      return NextResponse.json({ error: 'Image is too large' }, { status: 413 });
    }

    const image = await readImageResponse(response);

    const imageBody = image.slice().buffer as ArrayBuffer;
    return new NextResponse(imageBody, {
      status: 200,
      headers: {
        'Content-Type': contentType!,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error instanceof Error ? error.message : 'unknown_error');
    return NextResponse.json({ error: 'Proxy fetch error' }, { status: 500 });
  }
}
