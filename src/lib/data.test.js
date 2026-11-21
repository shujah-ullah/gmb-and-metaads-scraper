import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSuggestions, isExportable, normalizeRows, parseImportText, scoreBusinessAd, sourceAuthorizationError } from './data.js';

const source = {
  id: 'source-1', name: 'Licensed sample', type: 'licensed-provider', licenseLabel: 'Example license',
  rightsNote: 'Allows local storage and CSV export.', storageAllowed: true, exportAllowed: true,
  importedAt: '2026-11-21T00:00:00.000Z',
};

test('CSV parser handles quoted commas, escaped quotes, and line breaks', () => {
  const rows = parseImportText('name,description\r\n"North, LLC","Says ""hello""\nthere"\r\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'North, LLC');
  assert.equal(rows[0].description, 'Says "hello"\nthere');
});

test('JSON import accepts arrays and nested records', () => {
  assert.deepEqual(parseImportText('[{"name":"One"}]', 'x.json'), [{ name: 'One' }]);
  assert.deepEqual(parseImportText('{"businesses":[{"name":"Two"}]}', 'x.json'), [{ name: 'Two' }]);
});

test('normalization maps common business and ad headers and flags missing names', () => {
  const businesses = normalizeRows([{ 'Business Name': 'North Star', City: 'Austin', Website: 'northstar.example' }, { City: 'Missing Name' }], 'business', source);
  assert.equal(businesses.records[0].name, 'North Star');
  assert.equal(businesses.records[0].website, 'https://northstar.example');
  assert.equal(businesses.rejected.length, 1);
  const ads = normalizeRows([{ 'Page Name': 'North Star', 'Ad Text': 'Sample', Active: 'yes' }], 'ad', source);
  assert.equal(ads.records[0].name, 'North Star');
  assert.equal(ads.records[0].status, 'Active');
});

test('Google Maps import is blocked without separate written permission', () => {
  const google = { ...source, type: 'google-maps', name: 'Google Places export', explicitWrittenPermission: false };
  assert.match(sourceAuthorizationError(google), /separate written permission/i);
  google.explicitWrittenPermission = true;
  google.rightsNote = 'Custom written permission covers local storage and export.';
  assert.equal(sourceAuthorizationError(google), '');
});

test('export requires both storage and export rights', () => {
  assert.equal(isExportable({ storageAllowed: true, exportAllowed: true }), true);
  assert.equal(isExportable({ storageAllowed: true, exportAllowed: false }), false);
  assert.equal(isExportable({ storageAllowed: false, exportAllowed: true }), false);
});

test('match score explains exact name, domain, and supplied location evidence', () => {
  const business = { name: 'North Star Solar', website: 'https://northstar.example', city: 'Austin', country: 'US' };
  const ad = { name: 'North Star Solar', website: 'https://www.northstar.example', city: 'Austin', country: 'US' };
  const score = scoreBusinessAd(business, ad);
  assert.equal(score.score, 1);
  assert.ok(score.reasons.includes('Website domain matches'));
  assert.ok(score.reasons.includes('Same supplied city'));
  assert.equal(buildSuggestions([business], [ad]).length, 1);
});
