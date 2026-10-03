import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import booleanWithin from '@turf/boolean-within';
import circle from '@turf/circle';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DAGUPAN_POLYGON_PATH = path.join(__dirname, '..', 'data', 'dagupan-barangays.geojson');

const geojson = JSON.parse(readFileSync(DAGUPAN_POLYGON_PATH, 'utf8'));
if (geojson?.type !== 'FeatureCollection' || !Array.isArray(geojson.features) || !geojson.features.length) {
  throw new Error(`Invalid Dagupan barangay GeoJSON: ${DAGUPAN_POLYGON_PATH}`);
}

const normalizeBarangayName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const features = geojson.features;
const barangayNames = features.map((feature) => normalizeBarangayName(feature.properties?.barangay));
if (barangayNames.some((name) => !name) || new Set(barangayNames).size !== barangayNames.length) {
  throw new Error('Dagupan barangay GeoJSON must have one unique barangay name per feature.');
}
if (features.some((feature) => !['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))) {
  throw new Error('Dagupan barangay GeoJSON contains a non-polygon geometry.');
}

export const DAGUPAN_BARANGAYS = Object.freeze(barangayNames);
const pointFeature = (lng, lat) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } });

const coordinatePairs = [];
const collectCoordinatePairs = (coordinates) => {
  if (Array.isArray(coordinates?.[0])) {
    coordinates.forEach(collectCoordinatePairs);
  } else if (Number.isFinite(coordinates?.[0]) && Number.isFinite(coordinates?.[1])) {
    coordinatePairs.push(coordinates);
  }
};
features.forEach((feature) => collectCoordinatePairs(feature.geometry.coordinates));
export const DAGUPAN_BOUNDS = Object.freeze({
  minLng: Math.min(...coordinatePairs.map(([lng]) => lng)),
  maxLng: Math.max(...coordinatePairs.map(([lng]) => lng)),
  minLat: Math.min(...coordinatePairs.map(([, lat]) => lat)),
  maxLat: Math.max(...coordinatePairs.map(([, lat]) => lat)),
});

export const isDagupanBarangay = (value) => DAGUPAN_BARANGAYS.includes(normalizeBarangayName(value));

const matchingFeatures = (point) => features.filter((feature) => booleanPointInPolygon(point, feature, { ignoreBoundary: false }));

export const resolveBarangayFromCoords = (lat, lng, accuracyMeters = null) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { status: 'invalid_coordinates', barangay: null, candidate: null, matches: [] };
  }
  if (accuracyMeters !== null && accuracyMeters !== undefined && (!Number.isFinite(Number(accuracyMeters)) || Number(accuracyMeters) < 0)) {
    return { status: 'invalid_accuracy', barangay: null, candidate: null, matches: [] };
  }

  const point = pointFeature(longitude, latitude);
  const matches = matchingFeatures(point);
  const names = matches.map((feature) => normalizeBarangayName(feature.properties.barangay));
  if (!names.length) return { status: 'unresolved', barangay: null, candidate: null, matches: [] };
  if (names.length > 1) return { status: 'ambiguous', barangay: null, candidate: null, matches: names };

  const accuracy = accuracyMeters === null || accuracyMeters === undefined ? null : Number(accuracyMeters);
  if (accuracy > 0) {
    const uncertaintyArea = circle(point, accuracy / 1000, { steps: 64, units: 'kilometers' });
    const certainMatches = features.filter((feature) => booleanWithin(uncertaintyArea, feature));
    if (certainMatches.length !== 1 || normalizeBarangayName(certainMatches[0].properties.barangay) !== names[0]) {
      return { status: 'low_accuracy', barangay: null, candidate: names[0], matches: names, accuracyMeters: accuracy };
    }
  }

  return { status: 'resolved', barangay: names[0], candidate: names[0], matches: names, accuracyMeters: accuracy };
};

export const detectBarangayByLocation = ({ lat, lng, accuracyMeters = null }) => resolveBarangayFromCoords(lat, lng, accuracyMeters).barangay;

export const isDagupanLocation = ({ lat, lng }) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return matchingFeatures(pointFeature(longitude, latitude)).length > 0;
};
