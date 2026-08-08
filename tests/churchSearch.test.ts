import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildChurchSearchQuery,
  filterChurchesByRequestedLocation,
  mergeChurchSearchResults,
  normalizeGooglePlaceChurch,
  normalizeNominatimChurch,
  resolveChurchSearchGoogleApiKey,
  validateChurchSearchRequest,
} from '../utils/churchSearch.ts';

test('buildChurchSearchQuery keeps church intent and location context', () => {
  assert.equal(
    buildChurchSearchQuery({ term: 'Batista Central', city: 'Manaus', state: 'AM' }),
    'igreja Batista Central, Manaus, AM, Brasil',
  );
});

test('buildChurchSearchQuery does not duplicate igreja and fixes common typo', () => {
  assert.equal(
    buildChurchSearchQuery({ term: 'Igreje Maranata', city: 'Manaus', state: 'AM' }),
    'igreja Maranata, Manaus, AM, Brasil',
  );
});

test('validateChurchSearchRequest rejects oversized and control-character input', () => {
  assert.deepEqual(
    validateChurchSearchRequest({ term: ' Batista Central ', city: 'Manaus', state: 'AM', pageToken: '' }),
    { term: 'Batista Central', city: 'Manaus', state: 'AM', pageToken: '' },
  );
  assert.equal(validateChurchSearchRequest({ term: 'x'.repeat(161) }), null);
  assert.equal(validateChurchSearchRequest({ city: 'Manaus\u0000' }), null);
});

test('resolveChurchSearchGoogleApiKey accepts only private server environment variables', () => {
  assert.equal(
    resolveChurchSearchGoogleApiKey({ GOOGLE_PLACES_API_KEY: 'places-key', NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'public-key' }),
    'places-key',
  );
  assert.equal(resolveChurchSearchGoogleApiKey({ GOOGLE_MAPS_API_KEY: 'maps-key' }), 'maps-key');
  assert.equal(resolveChurchSearchGoogleApiKey({ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'public-key' }), '');
});

test('normalizeNominatimChurch maps provider data into persistent church shape', () => {
  const church = normalizeNominatimChurch({
    place_id: 12345,
    osm_type: 'node',
    osm_id: 678,
    lat: '-3.1019',
    lon: '-60.025',
    display_name: 'Igreja Batista Central, Centro, Manaus, Amazonas, Brasil',
    name: 'Igreja Batista Central',
    address: {
      city: 'Manaus',
      state: 'Amazonas',
      country: 'Brasil',
      road: 'Avenida Teste',
      house_number: '123',
    },
    extratags: {
      denomination: 'baptist',
    },
  });

  assert.equal(church.name, 'Igreja Batista Central');
  assert.equal(church.location.city, 'Manaus');
  assert.equal(church.location.state, 'Amazonas');
  assert.equal(church.location.address, 'Avenida Teste, 123');
  assert.equal(church.externalProvider, 'nominatim');
  assert.equal(church.externalPlaceId, 'node:678');
  assert.equal(church.lat, -3.1019);
  assert.equal(church.lng, -60.025);
});

test('normalizeGooglePlaceChurch maps Google Places data into persistent church shape', () => {
  const church = normalizeGooglePlaceChurch({
    id: 'ChIJ123',
    displayName: { text: 'Igreja Batista Uniao' },
    formattedAddress: 'Rua Teste, 100 - Manaus, AM, Brasil',
    location: { latitude: -3.12, longitude: -60.02 },
    addressComponents: [
      { longText: 'Manaus', shortText: 'Manaus', types: ['locality'] },
      { longText: 'Amazonas', shortText: 'AM', types: ['administrative_area_level_1'] },
    ],
  });

  assert.equal(church.name, 'Igreja Batista Uniao');
  assert.equal(church.location.city, 'Manaus');
  assert.equal(church.location.state, 'AM');
  assert.equal(church.externalProvider, 'google_places');
  assert.equal(church.externalPlaceId, 'ChIJ123');
  assert.equal(church.lat, -3.12);
  assert.equal(church.lng, -60.02);
});

test('mergeChurchSearchResults keeps local church when external result has same provider id', () => {
  const merged = mergeChurchSearchResults(
    [
      {
        id: 'local-1',
        name: 'Igreja Batista Central',
        acronym: '',
        slug: 'igreja-batista-central-manaus',
        denomination: '',
        location: { city: 'Manaus', state: 'AM', address: 'Centro' },
        stats: { memberCount: 1, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
        teams: [],
        teamScores: {},
        admins: [],
        externalProvider: 'nominatim',
        externalPlaceId: 'node:678',
        verificationStatus: 'unclaimed',
      },
    ],
    [
      {
        id: 'external-nominatim-node-678',
        name: 'Igreja Batista Central',
        acronym: '',
        slug: 'igreja-batista-central-manaus',
        denomination: '',
        location: { city: 'Manaus', state: 'Amazonas', address: 'Centro' },
        stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
        teams: [],
        teamScores: {},
        admins: [],
        externalProvider: 'nominatim',
        externalPlaceId: 'node:678',
        verificationStatus: 'external',
      },
    ],
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'local-1');
});

test('filterChurchesByRequestedLocation removes churches from another city', () => {
  const base = {
    acronym: '',
    slug: 'igreja',
    denomination: '',
    stats: { memberCount: 0, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
    teams: [],
    teamScores: {},
    admins: [],
    externalProvider: 'nominatim',
    verificationStatus: 'external',
    isExternal: true,
  };

  const filtered = filterChurchesByRequestedLocation(
    [
      { ...base, id: '1', name: 'Igreja Maranata Manaus', location: { city: 'Manaus', state: 'Amazonas', address: '' }, externalPlaceId: 'node:1' },
      { ...base, id: '2', name: 'Igreja Maranata Manacapuru', location: { city: 'Manacapuru', state: 'Amazonas', address: '' }, externalPlaceId: 'node:2' },
    ],
    { city: 'Manaus', state: 'AM' },
  );

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].location.city, 'Manaus');
});
