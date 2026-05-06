import type { Church } from '../types';

export type ChurchVerificationStatus = 'external' | 'unclaimed' | 'claimed' | 'verified';

export interface ChurchSearchInput {
  term?: string;
  city?: string;
  state?: string;
}

export interface NominatimChurchResult {
  place_id?: number | string;
  osm_type?: string;
  osm_id?: number | string;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  address?: Record<string, string | undefined>;
  extratags?: Record<string, string | undefined>;
  namedetails?: Record<string, string | undefined>;
}

export interface GooglePlaceResult {
  id?: string;
  displayName?: {
    text?: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  primaryType?: string;
  types?: string[];
}

export type ChurchSearchResult = Church & {
  externalProvider?: string;
  externalPlaceId?: string;
  sourceAttribution?: string;
  verificationStatus?: ChurchVerificationStatus;
  lat?: number | null;
  lng?: number | null;
  isExternal?: boolean;
};

const OSM_ATTRIBUTION = 'Data (c) OpenStreetMap contributors, ODbL 1.0';
const GOOGLE_ATTRIBUTION = 'Dados do Google Places';

const cleanPart = (value?: string) => String(value || '').trim();

const normalizeText = (value?: string) =>
  cleanPart(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const cleanChurchTerm = (value?: string) =>
  cleanPart(value)
    .replace(/\bigreje\b/gi, 'igreja')
    .replace(/\s+/g, ' ');

const generateChurchSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const makeAddress = (address: Record<string, string | undefined> = {}, fallback = '') => {
  const road = cleanPart(address.road || address.pedestrian || address.footway || address.neighbourhood);
  const houseNumber = cleanPart(address.house_number);
  const suburb = cleanPart(address.suburb || address.city_district || address.neighbourhood);
  const parts = [road && houseNumber ? `${road}, ${houseNumber}` : road, suburb].filter(Boolean);
  return parts.join(' - ') || fallback;
};

const getCity = (address: Record<string, string | undefined> = {}) =>
  cleanPart(address.city || address.town || address.village || address.municipality || address.county);

const getState = (address: Record<string, string | undefined> = {}) =>
  cleanPart(address.state || address.region || address['ISO3166-2-lvl4']);

const getName = (place: NominatimChurchResult) => {
  const named = place.namedetails?.name || place.namedetails?.['name:pt'] || place.name;
  if (cleanPart(named)) return cleanPart(named);
  return cleanPart(place.display_name).split(',')[0] || 'Igreja';
};

const getExternalPlaceId = (place: NominatimChurchResult) => {
  if (place.osm_type && place.osm_id) return `${place.osm_type}:${place.osm_id}`;
  return place.place_id ? `place:${place.place_id}` : '';
};

export const buildChurchSearchQuery = ({ term, city, state }: ChurchSearchInput) => {
  const query = cleanChurchTerm(term);
  const location = [cleanPart(city), cleanPart(state), 'Brasil'].filter(Boolean).join(', ');
  const subject = query && /\bigreja\b/i.test(query) ? query : ['igreja', query].filter(Boolean).join(' ');
  return [subject, location].filter(Boolean).join(', ');
};

const getGoogleAddressComponent = (place: GooglePlaceResult, types: string[]) => {
  const component = place.addressComponents?.find((item) =>
    item.types?.some((type) => types.includes(type)),
  );
  return cleanPart(component?.shortText || component?.longText);
};

export const normalizeGooglePlaceChurch = (place: GooglePlaceResult): ChurchSearchResult => {
  const name = cleanPart(place.displayName?.text) || 'Igreja';
  const city = getGoogleAddressComponent(place, ['locality', 'administrative_area_level_2']);
  const state = getGoogleAddressComponent(place, ['administrative_area_level_1']);
  const externalPlaceId = cleanPart(place.id);
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  const slug = generateChurchSlug([name, city, state].filter(Boolean).join(' '));

  return {
    id: `external-google-${externalPlaceId.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name,
    acronym: '',
    slug,
    denomination: '',
    location: {
      city,
      state,
      address: cleanPart(place.formattedAddress || place.shortFormattedAddress),
    },
    stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
    teams: [],
    teamScores: {},
    admins: [],
    externalProvider: 'google_places',
    externalPlaceId,
    sourceAttribution: GOOGLE_ATTRIBUTION,
    verificationStatus: 'external',
    lat: typeof lat === 'number' && Number.isFinite(lat) ? lat : null,
    lng: typeof lng === 'number' && Number.isFinite(lng) ? lng : null,
    isExternal: true,
  };
};

export const normalizeNominatimChurch = (place: NominatimChurchResult): ChurchSearchResult => {
  const name = getName(place);
  const address = place.address || {};
  const city = getCity(address);
  const state = getState(address);
  const externalPlaceId = getExternalPlaceId(place);
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  const slug = generateChurchSlug([name, city, state].filter(Boolean).join(' '));

  return {
    id: `external-nominatim-${externalPlaceId.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name,
    acronym: '',
    slug,
    denomination: place.extratags?.denomination || '',
    location: {
      city,
      state,
      address: makeAddress(address, cleanPart(place.display_name)),
    },
    stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
    teams: [],
    teamScores: {},
    admins: [],
    externalProvider: 'nominatim',
    externalPlaceId,
    sourceAttribution: OSM_ATTRIBUTION,
    verificationStatus: 'external',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    isExternal: true,
  };
};

export const mergeChurchSearchResults = (
  localResults: ChurchSearchResult[],
  externalResults: ChurchSearchResult[],
): ChurchSearchResult[] => {
  const seen = new Set<string>();
  const merged: ChurchSearchResult[] = [];

  const keyFor = (church: ChurchSearchResult) => {
    if (church.externalProvider && church.externalPlaceId) {
      return `${church.externalProvider}:${church.externalPlaceId}`;
    }
    return `${church.name}:${church.location?.city}:${church.location?.state}`.toLowerCase();
  };

  for (const church of [...localResults, ...externalResults]) {
    const key = keyFor(church);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(church);
  }

  return merged;
};

export const filterChurchesByRequestedLocation = (
  results: ChurchSearchResult[],
  { city, state }: ChurchSearchInput,
) => {
  const requestedCity = normalizeText(city);
  const requestedState = normalizeText(state);
  if (!requestedCity && !requestedState) return results;

  return results.filter((church) => {
    const churchCity = normalizeText(church.location?.city);
    const churchState = normalizeText(church.location?.state);
    const cityMatches = !requestedCity || !churchCity || churchCity === requestedCity;
    const stateMatches = !requestedState || !churchState || churchState === requestedState || churchState.includes(requestedState);
    return cityMatches && stateMatches;
  });
};
