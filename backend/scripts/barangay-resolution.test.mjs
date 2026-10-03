import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import pointOnFeature from '@turf/point-on-feature';
import ActivityLog from '../models/ActivityLog.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { createReport, updateReport } from '../controllers/reportController.js';
import { resolveBarangayFromCoords } from '../utils/dagupanBarangays.js';

const geojson = JSON.parse(readFileSync(new URL('../data/dagupan-barangays.geojson', import.meta.url), 'utf8'));
const features = geojson.features;
const strictInteriorPoints = {
  'Bacayao Sur': [120.341225447103, 16.025104556],
  Salapingao: [120.317886901082, 16.057124912],
};

test('Dagupan GeoJSON contains 31 unique PSGC-coded barangays in longitude/latitude order', () => {
  assert.equal(features.length, 31);
  assert.equal(new Set(features.map((feature) => feature.properties.barangay)).size, 31);
  assert.ok(features.every((feature) => /^01\d{8}$/.test(feature.properties.psgc)));

  const coordinates = features.flatMap((feature) => {
    const points = [];
    const visit = (value) => Array.isArray(value?.[0]) ? value.forEach(visit) : points.push(value);
    visit(feature.geometry.coordinates);
    return points;
  });
  assert.ok(coordinates.every(([longitude, latitude]) => longitude > 120 && longitude < 121 && latitude > 16 && latitude < 17));
});

for (const feature of features) {
  test(`interior point resolves to ${feature.properties.barangay}`, () => {
    const [longitude, latitude] = strictInteriorPoints[feature.properties.barangay]
      || pointOnFeature(feature).geometry.coordinates;
    const result = resolveBarangayFromCoords(latitude, longitude);
    assert.equal(result.status, 'resolved');
    assert.equal(result.barangay, feature.properties.barangay);
  });
}

const acceptancePoints = [
  { name: 'A Arellano / UPang Gym', lat: 16.0485, lng: 120.3410, expected: 'Pantal' },
  { name: 'B Pantal Road', lat: 16.0430, lng: 120.3380, expected: 'Pantal' },
  { name: 'C Pantal River', lat: 16.0400, lng: 120.3350, expected: 'Pantal' },
  { name: 'D Pogo Grande center', lat: 16.0376, lng: 120.3491, expected: 'Pogo Grande' },
  { name: 'E Herrero center', lat: 16.0500, lng: 120.3450, expected: 'Herrero' },
  { name: 'F Poblacion Oeste center', lat: 16.0430, lng: 120.3330, expected: 'Poblacion Oeste' },
];

for (const point of acceptancePoints) {
  test(`${point.name} matches its stated expected barangay`, () => {
    const result = resolveBarangayFromCoords(point.lat, point.lng);
    assert.equal(result.status, 'resolved');
    assert.equal(result.barangay, point.expected);
  });
}

test('outside Dagupan remains unresolved', () => {
  assert.deepEqual(resolveBarangayFromCoords(16.0000, 120.3000), {
    status: 'unresolved', barangay: null, candidate: null, matches: [],
  });
});

test('poor GPS accuracy does not assert a barangay', () => {
  const result = resolveBarangayFromCoords(16.0485, 120.3410, 500);
  assert.equal(result.status, 'low_accuracy');
  assert.equal(result.barangay, null);
});

test('a coordinate shared by two barangays is reported as ambiguous', () => {
  const result = resolveBarangayFromCoords(16.038362221000057, 120.34091891800004);
  assert.equal(result.status, 'ambiguous');
  assert.deepEqual(result.matches, ['Bacayao Norte', 'Herrero']);
});

test('report creation ignores a frontend barangay claim and stores the polygon result', async () => {
  const originals = {
    findOne: Report.findOne,
    create: Report.create,
    find: User.find,
    createActivity: ActivityLog.create,
  };
  let storedReport;
  Report.findOne = () => ({ select() { return this; }, lean: async () => null });
  Report.create = async (document) => {
    storedReport = document;
    return { ...document, _id: 'test-report-id', status: 'Pending' };
  };
  User.find = () => ({ select: async () => [] });
  ActivityLog.create = async () => null;

  try {
    let responseBody;
    let responseStatus;
    const req = {
      body: {
        category: 'Pothole',
        description: 'Test report description',
        customCategory: '',
        address: 'Arellano Street',
        location: { type: 'Point', coordinates: [120.3410, 16.0485] },
        barangay: 'Herrero',
        photo: 'https://example.invalid/photo.jpg',
        locationAccuracyMeters: 8,
        locationCapturedAt: '2026-10-03T00:00:00.000Z',
      },
      files: [],
      user: { _id: 'test-user-id', name: 'Test User', email: 'test@example.invalid' },
    };
    const res = {
      status(code) { responseStatus = code; return this; },
      json(body) { responseBody = body; return this; },
    };

    await createReport(req, res, (error) => { throw error; });

    assert.equal(responseStatus, 201);
    assert.equal(responseBody.report.barangay, 'Pantal');
    assert.equal(storedReport.barangay, 'Pantal');
    assert.deepEqual(storedReport.location.coordinates, [120.3410, 16.0485]);
    assert.equal(storedReport.locationAccuracyMeters, 8);
    assert.equal(new Date(storedReport.locationCapturedAt).toISOString(), '2026-10-03T00:00:00.000Z');
  } finally {
    Report.findOne = originals.findOne;
    Report.create = originals.create;
    User.find = originals.find;
    ActivityLog.create = originals.createActivity;
  }
});

test('location updates re-resolve the barangay and preserve refreshed location metadata', async () => {
  const originals = {
    find: Report.findOne,
    update: Report.findOneAndUpdate,
    activity: ActivityLog.create,
  };
  let updatedPayload;
  Report.findOne = async () => ({ status: 'Pending' });
  Report.findOneAndUpdate = async (_filter, payload) => {
    updatedPayload = payload;
    return payload;
  };
  ActivityLog.create = async () => null;

  try {
    const response = {
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    await updateReport({
      params: { id: 'test-report-id' },
      body: {
        location: { type: 'Point', coordinates: [120.3330, 16.0430] },
        locationAccuracyMeters: 8,
        locationCapturedAt: new Date('2026-10-03T06:30:00.000Z'),
      },
      user: { _id: 'test-staff-id', name: 'Test Staff', role: 'staff' },
    }, response, (error) => { throw error; });

    assert.equal(updatedPayload.barangay, 'Poblacion Oeste');
    assert.equal(updatedPayload.address, 'Barangay Poblacion Oeste, Dagupan City, Pangasinan');
    assert.deepEqual(updatedPayload.location.coordinates, [120.3330, 16.0430]);
    assert.equal(updatedPayload.locationAccuracyMeters, 8);
    assert.equal(updatedPayload.locationCapturedAt.toISOString(), '2026-10-03T06:30:00.000Z');
  } finally {
    Report.findOne = originals.find;
    Report.findOneAndUpdate = originals.update;
    ActivityLog.create = originals.activity;
  }
});