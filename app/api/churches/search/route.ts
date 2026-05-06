import { NextRequest, NextResponse } from 'next/server';

import {
  buildChurchSearchQuery,
  filterChurchesByRequestedLocation,
  normalizeGooglePlaceChurch,
  normalizeNominatimChurch,
} from '../../../../utils/churchSearch';

export const dynamic = 'force-dynamic';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';
const PAGE_SIZE = 10;

const getGooglePlacesKey = () =>
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PRIVATE_GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  '';

const searchGooglePlaces = async ({
  query,
  pageToken,
  requestedLocation,
}: {
  query: string;
  pageToken?: string;
  requestedLocation: { city: string; state: string };
}) => {
  const apiKey = getGooglePlacesKey();
  if (!apiKey) return null;

  const body: Record<string, any> = {
    textQuery: query,
    pageSize: PAGE_SIZE,
    languageCode: 'pt-BR',
    regionCode: 'BR',
    includedType: 'church',
  };
  if (pageToken) body.pageToken = pageToken;

  const response = await fetch(GOOGLE_PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.shortFormattedAddress',
        'places.location',
        'places.addressComponents',
        'places.primaryType',
        'places.types',
        'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[church-search] Google Places error:', response.status, detail);
    return null;
  }

  const payload = await response.json();
  const results = Array.isArray(payload.places)
    ? payload.places.map(normalizeGooglePlaceChurch).filter((church: any) => church.externalPlaceId)
    : [];

  return {
    provider: 'google_places',
    attribution: 'Dados do Google Places',
    nextPageToken: payload.nextPageToken || null,
    results: filterChurchesByRequestedLocation(results, requestedLocation),
  };
};

const searchNominatim = async (query: string, requestedLocation: { city: string; state: string }) => {
  const upstreamUrl = new URL(NOMINATIM_URL);
  upstreamUrl.searchParams.set('q', query);
  upstreamUrl.searchParams.set('format', 'jsonv2');
  upstreamUrl.searchParams.set('addressdetails', '1');
  upstreamUrl.searchParams.set('extratags', '1');
  upstreamUrl.searchParams.set('namedetails', '1');
  upstreamUrl.searchParams.set('limit', String(PAGE_SIZE));
  upstreamUrl.searchParams.set('countrycodes', 'br');

  const response = await fetch(upstreamUrl.toString(), {
    headers: {
      'User-Agent': 'BibliaLM/1.0 church-search contato@biblialm.com.br',
      Referer: 'https://biblialm.com.br',
    },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return { provider: 'nominatim', attribution: 'Data (c) OpenStreetMap contributors, ODbL 1.0', results: [], nextPageToken: null };
  }

  const places = await response.json();
  const results = Array.isArray(places)
    ? places.map(normalizeNominatimChurch).filter((church) => church.externalPlaceId)
    : [];

  return {
    provider: 'nominatim',
    attribution: 'Data (c) OpenStreetMap contributors, ODbL 1.0',
    nextPageToken: null,
    results: filterChurchesByRequestedLocation(results, requestedLocation),
    warning: getGooglePlacesKey() ? null : 'google_places_key_missing',
  };
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';
  const city = searchParams.get('city') || '';
  const state = searchParams.get('state') || '';
  const pageToken = searchParams.get('pageToken') || '';

  if (!term.trim() && !city.trim()) {
    return NextResponse.json({ results: [] });
  }

  const query = buildChurchSearchQuery({ term, city, state });

  try {
    const googleResults = await searchGooglePlaces({ query, pageToken, requestedLocation: { city, state } });
    if (googleResults) return NextResponse.json(googleResults);

    return NextResponse.json(await searchNominatim(query, { city, state }));
  } catch (error) {
    console.error('[church-search] external provider error:', error);
    return NextResponse.json({ results: [], error: 'search_unavailable' }, { status: 500 });
  }
}
