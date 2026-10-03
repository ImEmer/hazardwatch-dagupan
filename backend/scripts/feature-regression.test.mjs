import test from 'node:test';
import assert from 'node:assert/strict';

import { createDeviceFingerprint, syncKnownDevice } from '../controllers/authController.js';
import { detectBarangayByLocation } from '../utils/dagupanBarangays.js';
import { buildAccountVerifiedEmail, buildNewDeviceAlertEmail } from '../utils/sendEmail.js';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

test('new device fingerprint is stable and includes the user-provided device id when present', () => {
  const fingerprint = createDeviceFingerprint({ userAgent, acceptLanguage: 'en-US,en;q=0.9', deviceId: 'device-123' });
  assert.equal(typeof fingerprint, 'string');
  assert.ok(fingerprint.length > 20);
  assert.equal(createDeviceFingerprint({ userAgent, acceptLanguage: 'en-US,en;q=0.9', deviceId: 'device-123' }), fingerprint);
});

test('known devices are capped and new entries are added with the latest metadata', () => {
  const devices = Array.from({ length: 20 }, (_, index) => ({ deviceId: `device-${index}`, firstSeenAt: new Date(), lastSeenAt: new Date(), userAgent: 'ua', ip: '127.0.0.1' }));
  const updated = syncKnownDevice(devices, { deviceId: 'device-99', userAgent, ip: '203.0.113.10' });
  assert.equal(updated.length, 20);
  assert.equal(updated[updated.length - 1].deviceId, 'device-99');
  assert.equal(updated[updated.length - 1].ip, '203.0.113.10');
});

test('verified account email templates include the expected subject and action link', () => {
  const email = buildAccountVerifiedEmail({ name: 'Emerson', email: 'emerson@example.com' });
  assert.match(email.subject, /Account Verified/i);
  assert.match(email.html, /Sign in/i);
  assert.match(email.html, /hazardwatch/i);
});

test('new-device alert email template includes the reset link and device summary', () => {
  const email = buildNewDeviceAlertEmail({ name: 'Emerson', email: 'emerson@example.com', deviceName: 'Chrome on Windows', ipAddress: '203.0.113.10', sentAt: new Date('2026-10-03T12:00:00Z') });
  assert.match(email.subject, /New device sign-in/i);
  assert.match(email.html, /reset your password/i);
  assert.match(email.html, /Chrome on Windows/i);
  assert.match(email.html, /203.0.113.10/);
});

test('barangay detection resolves the Pantal boundary correctly instead of the wrong Pogo Grande label', () => {
  const pantalPoint = { lat: 16.0495, lng: 120.3438 };
  const pogoPoint = { lat: 16.0394, lng: 120.3185 };

  assert.equal(detectBarangayByLocation(pantalPoint), 'Pantal');
  assert.equal(detectBarangayByLocation(pogoPoint), 'Pogo Grande');
});
